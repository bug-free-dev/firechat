'use client';

import {
	type DatabaseReference,
	type DataSnapshot,
	limitToLast,
	off as rtdbOff,
	onChildAdded,
	onChildChanged,
	onChildRemoved,
	type Query,
	query as rtdbQuery,
	ref as rtdbRef,
} from 'firebase/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { markInboxRead, removeInboxThread } from '@/app/lib/api/inboxAPI';
import { rtdb } from '@/app/lib/firebase/FireClient';
import type { InboxInviteItem, InboxThread, ServerResult } from '@/app/lib/types';
import { compare, create } from '@/app/lib/utils/time';

export interface UseFireInboxOptions {
	limit?: number;
	fallbackLoadingMs?: number;
}

export interface UseFireInboxReturn {
	threads: InboxThread[];
	loading: boolean;
	error: string | null;
	markRead: (threadId: string) => Promise<ServerResult<null>>;
	removeThread: (threadId: string) => Promise<ServerResult<null>>;
	refresh: () => void;
}

function ensureInvite(raw: Partial<InboxInviteItem> | undefined | null): InboxInviteItem {
	const now = create.nowISO();
	return {
		type: 'invite',
		from: (raw && typeof raw.from === 'string' && raw.from) || '',
		sessionId: (raw && typeof raw.sessionId === 'string' && raw.sessionId) || '',
		message: (raw && typeof raw.message === 'string' && raw.message) || '',
		createdAt: (raw && typeof raw.createdAt === 'string' && raw.createdAt) || now,
		read: Boolean(raw && raw.read),
	};
}

export function useFireInbox(
	userUid: string | null,
	opts?: UseFireInboxOptions
): UseFireInboxReturn {
	const limit = opts?.limit;
	const fallbackLoadingMs = opts?.fallbackLoadingMs ?? 800;

	const [threads, setThreads] = useState<InboxThread[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const mapRef = useRef<Map<string, InboxThread>>(new Map());
	const mountedRef = useRef<boolean>(true);
	const queryRef = useRef<Query | DatabaseReference | null>(null);
	const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const basePath = useMemo(() => (userUid ? `inbox/${userUid}` : null), [userUid]);

	const toThread = useCallback(
		(key: string | null, item: unknown): InboxThread | null => {
			if (!key || !item || typeof item !== 'object') return null;

			const invite = ensureInvite(item as Partial<InboxInviteItem>);

			// Validate required fields
			if (!invite.from || !invite.sessionId) return null;
			if (!userUid) return null;

			return {
				id: key,
				participants: [invite.from, userUid],
				lastMessage: {
					text: invite.message,
					sender: invite.from,
					timestamp: invite.createdAt,
				},
				unreadCount: invite.read ? 0 : 1,
				raw: invite,
			};
		},
		[userUid]
	);

	const syncToState = useCallback(() => {
		const arr = Array.from(mapRef.current.values()).sort((a, b) =>
			compare.desc(a.lastMessage?.timestamp, b.lastMessage?.timestamp)
		);
		if (mountedRef.current) setThreads(arr);
	}, []);

	// Manual refresh - forces re-sync from server
	const refresh = useCallback((): void => {
		if (!basePath || !rtdb) return;

		// Clear current data and re-establish listeners
		mapRef.current.clear();
		if (mountedRef.current) {
			setThreads([]);
			setLoading(true);
			setError(null);
		}
	}, [basePath]);

	useEffect(() => {
		// If no path or rtdb isn't ready, clear and exit.
		if (!basePath || !rtdb) {
			mapRef.current.clear();
			if (mountedRef.current) {
				setThreads([]);
				setLoading(false);
				setError(null);
			}
			return;
		}

		if (mountedRef.current) {
			setLoading(true);
			setError(null);
		}
		mapRef.current.clear();

		const ref = rtdbRef(rtdb, basePath);
		const q = typeof limit === 'number' ? rtdbQuery(ref, limitToLast(limit)) : ref;
		queryRef.current = q;

		// Track if we've received any data
		let hasReceivedData = false;

		// Define handlers
		const handleAdd = (snap: DataSnapshot): void => {
			try {
				const key = snap.key;
				const val = snap.val();
				const t = toThread(key, val);
				if (!t) return;

				mapRef.current.set(t.id, t);
				syncToState();
				hasReceivedData = true;

				if (mountedRef.current) {
					setLoading(false);
					setError(null);
				}
			} catch {
				if (mountedRef.current) {
					setError('Failed to process inbox item');
				}
			}
		};

		const handleChange = (snap: DataSnapshot): void => {
			try {
				const key = snap.key;
				const val = snap.val();
				if (!key) return;

				if (!val) {
					mapRef.current.delete(key);
				} else {
					const t = toThread(key, val);
					if (t) mapRef.current.set(key, t);
				}
				syncToState();
			} catch {
				/**Ignore */
			}
		};

		const handleRemove = (snap: DataSnapshot): void => {
			try {
				const key = snap.key;
				if (!key) return;
				mapRef.current.delete(key);
				syncToState();
			} catch {
				/** Ignore */
			}
		};

		const handleError = (err: Error): void => {
			if (mountedRef.current) {
				setError(err.message || 'Failed to load inbox');
				setLoading(false);
			}
		};

		// Attach listeners with error handling
		onChildAdded(q, handleAdd, handleError);
		onChildChanged(q, handleChange, handleError);
		onChildRemoved(q, handleRemove, handleError);

		// Fallback timeout in case no data arrives
		fallbackTimerRef.current = setTimeout(() => {
			if (mountedRef.current && !hasReceivedData) {
				setLoading(false);
			}
		}, fallbackLoadingMs);

		return () => {
			if (fallbackTimerRef.current) {
				clearTimeout(fallbackTimerRef.current);
				fallbackTimerRef.current = null;
			}

			// Properly unsubscribe from all listeners
			try {
				if (queryRef.current) {
					rtdbOff(queryRef.current, 'child_added', handleAdd);
					rtdbOff(queryRef.current, 'child_changed', handleChange);
					rtdbOff(queryRef.current, 'child_removed', handleRemove);
				}
			} catch {
				/** ignore */
			}

			queryRef.current = null;
			mapRef.current.clear();

			if (mountedRef.current) {
				setThreads([]);
				setLoading(false);
			}
		};
	}, [basePath, limit, toThread, syncToState, fallbackLoadingMs]);

	// markRead wrapper -> returns server result
	const markReadWrapper = useCallback(
		async (threadId: string): Promise<ServerResult<null>> => {
			if (!userUid) return { ok: false, error: 'INVALID_INPUT' };
			if (!threadId) return { ok: false, error: 'INVALID_INPUT' };

			try {
				const res = await markInboxRead({ userUid, threadId });

				// Only update local state if server confirms success
				if (res.ok) {
					const existing = mapRef.current.get(threadId);
					if (existing) {
						const updated: InboxThread = {
							...existing,
							unreadCount: 0,
							raw: ensureInvite({ ...(existing.raw ?? {}), read: true }),
						};
						mapRef.current.set(threadId, updated);
						syncToState();
					}
				}

				return res;
			} catch (err) {
				return {
					ok: false,
					error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
				};
			}
		},
		[userUid, syncToState]
	);

	// removeThread wrapper -> returns server result
	const removeThreadWrapper = useCallback(
		async (threadId: string): Promise<ServerResult<null>> => {
			if (!userUid) return { ok: false, error: 'INVALID_INPUT' };
			if (!threadId) return { ok: false, error: 'INVALID_INPUT' };

			try {
				const res = await removeInboxThread({ userUid, threadId });

				// Only update local state if server confirms success
				if (res.ok) {
					mapRef.current.delete(threadId);
					syncToState();
				}

				return res;
			} catch (err) {
				return {
					ok: false,
					error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
				};
			}
		},
		[userUid, syncToState]
	);

	return {
		threads,
		loading,
		error,
		markRead: markReadWrapper,
		removeThread: removeThreadWrapper,
		refresh,
	};
}
