import { useCallback, useRef, useState } from 'react';

const SWIPE_THRESHOLD = 30;
const MAX_SWIPE = 40;
const RESISTANCE_FACTOR = 0.2;

export const useSwipeReply = (onReply: () => void) => {
	const [swipeOffset, setSwipeOffset] = useState(0);
	const touchStart = useRef<{ x: number; y: number } | null>(null);
	const hasTriggered = useRef(false);
	const rafId = useRef<number | undefined>(0);

	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0];
		if (!touch) return;

		touchStart.current = { x: touch.clientX, y: touch.clientY };
		hasTriggered.current = false;
	}, []);

	const handleTouchMove = useCallback((e: React.TouchEvent) => {
		if (!touchStart.current) return;
		const touch = e.touches[0];
		if (!touch) return;

		const deltaX = touch.clientX - touchStart.current.x;
		const deltaY = touch.clientY - touchStart.current.y;

		if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) return;

		if (deltaX <= 0) return;

		if (Math.abs(deltaX) > 10) {
			e.preventDefault();
		}

		if (rafId.current) cancelAnimationFrame(rafId.current);

		rafId.current = requestAnimationFrame(() => {
			const resistance =
				deltaX > MAX_SWIPE
					? RESISTANCE_FACTOR + (deltaX - MAX_SWIPE) / (MAX_SWIPE * 3)
					: RESISTANCE_FACTOR;

			const offset = Math.min(deltaX * resistance, MAX_SWIPE + 20);
			setSwipeOffset(offset);

			if (offset >= SWIPE_THRESHOLD && !hasTriggered.current && 'vibrate' in navigator) {
				navigator.vibrate(10);
				hasTriggered.current = true;
			}
		});
	}, []);

	const handleTouchEnd = useCallback(() => {
		if (rafId.current) {
			cancelAnimationFrame(rafId.current);
			rafId.current = undefined;
		}

		const shouldReply = swipeOffset >= SWIPE_THRESHOLD;

		setSwipeOffset(0);
		touchStart.current = null;

		if (shouldReply) {
			setTimeout(onReply, 100);
		}

		hasTriggered.current = false;
	}, [swipeOffset, onReply]);

	return {
		swipeOffset,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	};
};
