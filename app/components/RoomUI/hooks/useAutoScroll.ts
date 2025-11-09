import { useCallback, useEffect, useRef } from 'react';

import {
	AUTO_SCROLL_THRESHOLD,
	LOAD_MORE_TRIGGER_PX,
	SCROLL_DEBOUNCE_MS,
} from '@/app/components/RoomUI/constants';
import { ChatMessage } from '@/app/lib/types';

interface UseAutoScrollOpts {
	messages: ChatMessage[];
	hasMore?: boolean;
	isFetching?: boolean;
	onLoadMore?: () => void;
	containerRef: React.RefObject<HTMLDivElement | null>;
}

export const useAutoScroll = ({
	messages,
	hasMore = false,
	isFetching = false,
	onLoadMore,
	containerRef,
}: UseAutoScrollOpts) => {
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastMessageIdRef = useRef<string>('');
	const isInitializedRef = useRef(false);
	const isLoadingMoreRef = useRef(false);
	const prevScrollHeightRef = useRef(0);
	const userScrolledUpRef = useRef(false);
	const prevScrollTopRef = useRef(0);

	const scrollToBottom = useCallback(
		(behavior: 'auto' | 'smooth' = 'smooth') => {
			const container = containerRef.current;
			if (!container) return;

			requestAnimationFrame(() => {
				container.scrollTo({
					top: container.scrollHeight,
					behavior,
				});
			});
		},
		[containerRef]
	);

	const handleScroll = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
		const atBottom = distanceFromBottom <= AUTO_SCROLL_THRESHOLD;

		// detect direction: if user moved the thumb up, treat it as user intent to read history
		const prevTop = prevScrollTopRef.current;
		const scrolledUp = scrollTop < prevTop;
		prevScrollTopRef.current = scrollTop;

		if (scrolledUp) {
			userScrolledUpRef.current = true;
		} else if (atBottom) {
			// if user is at bottom, clear the "scrolled up" flag
			userScrolledUpRef.current = false;
		}
		// debounce for load more
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}

		scrollTimeoutRef.current = setTimeout(() => {
			if (
				!isLoadingMoreRef.current &&
				hasMore &&
				!isFetching &&
				container.scrollTop < LOAD_MORE_TRIGGER_PX &&
				onLoadMore
			) {
				isLoadingMoreRef.current = true;
				prevScrollHeightRef.current = container.scrollHeight;
				onLoadMore();
			}
		}, SCROLL_DEBOUNCE_MS);
	}, [containerRef, hasMore, isFetching, onLoadMore]);

	// initialize: scroll to bottom once and seed lastMessageIdRef
	useEffect(() => {
		if (!isInitializedRef.current && messages.length > 0) {
			isInitializedRef.current = true;
			requestAnimationFrame(() => {
				const c = containerRef.current;
				if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'auto' });
			});
			const last = messages[messages.length - 1];
			if (last?.id) lastMessageIdRef.current = last.id;
		}
	}, [messages, containerRef]);

	// when we loaded more (prepend), preserve scroll position
	useEffect(() => {
		if (isLoadingMoreRef.current && prevScrollHeightRef.current > 0) {
			const container = containerRef.current;
			if (!container) return;

			requestAnimationFrame(() => {
				const newScrollHeight = container.scrollHeight;
				const heightDiff = newScrollHeight - prevScrollHeightRef.current;

				if (heightDiff > 0) {
					// shift the scrollTop down by the added height so viewport doesn't jump
					container.scrollTop += heightDiff;
				}

				prevScrollHeightRef.current = 0;
				isLoadingMoreRef.current = false;
			});
		}
	}, [messages.length]);

	useEffect(() => {
		if (messages.length === 0) return;

		const latestMessage = messages[messages.length - 1];
		if (!latestMessage?.id) return;

		const isNewMessage = latestMessage.id !== lastMessageIdRef.current;

		if (isNewMessage) {
			lastMessageIdRef.current = latestMessage.id;

			// don't force-scroll if user intentionally scrolled up
			if (!userScrolledUpRef.current) {
				requestAnimationFrame(() => {
					scrollToBottom('smooth');
				});
			}
		}
	}, [messages, scrollToBottom]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		container.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
			container.removeEventListener('scroll', handleScroll);
		};
	}, [containerRef, handleScroll]);

	return { scrollToBottom, userScrolledUpRef };
};
