'use client';

import { useCallback, useRef, useState } from 'react';

import type { ChatMessage, ServerResult } from '@/app/lib/types';
import type { MessagesServices } from '@/app/lib/utils/message/typeDefs';

/* <----------- CONSTANTS -----------> */

const DEFAULT_INITIAL_LIMIT = 50;
const MAX_LIMIT = 200;

/* <----------- TYPES -----------> */

interface UseMessageFetchParams {
	readonly sessionId: string;
	readonly services: MessagesServices;
	readonly initialLimit?: number;
	readonly onMessagesBatch: (messages: ChatMessage[]) => void;
}

export interface UseMessageFetchReturn {
	readonly fetchOlder: (
		beforeIso?: string,
		limit?: number
	) => Promise<ServerResult<ChatMessage[]>>;
	readonly fetchInitial: () => Promise<ServerResult<ChatMessage[]>>;
	readonly isFetching: boolean;
	readonly hasMore: boolean;
}

/* <----------- HOOK -----------> */

export function useMessageFetch(params: UseMessageFetchParams): UseMessageFetchReturn {
	const { sessionId, services, initialLimit = DEFAULT_INITIAL_LIMIT, onMessagesBatch } = params;

	const [isFetching, setIsFetching] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const fetchedIdsRef = useRef<Set<string>>(new Set());
	const initialFetchedRef = useRef(false);

	/* <----------- FETCH INITIAL -----------> */

	const fetchInitial = useCallback(async (): Promise<ServerResult<ChatMessage[]>> => {
		if (initialFetchedRef.current) {
			return { ok: true, data: [] };
		}

		if (!sessionId?.trim()) {
			return { ok: false, error: 'INVALID_INPUT', reason: 'missing sessionId' };
		}

		setIsFetching(true);

		try {
			const res = await services.getMessages({
				sessionId,
				limit: initialLimit,
			});

			if (res.ok && res.data) {
				const newMessages = res.data.filter((m) => {
					if (!m.id || fetchedIdsRef.current.has(m.id)) return false;
					fetchedIdsRef.current.add(m.id);
					return true;
				});

				if (newMessages.length > 0) {
					onMessagesBatch(newMessages);
				}

				if (res.data.length < initialLimit) {
					setHasMore(false);
				}

				initialFetchedRef.current = true;
			}

			return res;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			return { ok: false, error: 'FETCH_FAILED', reason: errorMessage };
		} finally {
			setIsFetching(false);
		}
	}, [sessionId, services, initialLimit, onMessagesBatch]);

	/* <----------- FETCH OLDER -----------> */

	const fetchOlder = useCallback(
		async (
			beforeIso?: string,
			limit: number = initialLimit
		): Promise<ServerResult<ChatMessage[]>> => {
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing sessionId' };
			}

			if (!hasMore) {
				return { ok: true, data: [] };
			}

			const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);

			setIsFetching(true);

			try {
				const res = await services.getMessages({
					sessionId,
					limit: safeLimit,
					before: beforeIso?.trim() || undefined,
				});

				if (!res.ok) return res;

				// Filter out already fetched messages
				const newMessages = res.data.filter((m) => {
					if (!m.id || fetchedIdsRef.current.has(m.id)) return false;
					fetchedIdsRef.current.add(m.id);
					return true;
				});

				if (newMessages.length > 0) {
					onMessagesBatch(newMessages);
				}

				// Check if we've reached the end
				if (res.data.length < safeLimit) {
					setHasMore(false);
				}

				return { ok: true, data: newMessages };
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'FETCH_FAILED', reason: errorMessage };
			} finally {
				setIsFetching(false);
			}
		},
		[sessionId, services, initialLimit, onMessagesBatch, hasMore]
	);

	/* <----------- RETURN -----------> */

	return {
		fetchOlder,
		fetchInitial,
		isFetching,
		hasMore,
	};
}
