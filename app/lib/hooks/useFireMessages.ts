'use client';

import {
	limitToLast,
	off as rtdbOff,
	onChildAdded,
	onChildChanged,
	onChildRemoved,
	type Query as RTDBQuery,
	query as rtdbQuery,
	ref as rtdbRef,
} from 'firebase/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clearUserTyping, setUserTyping } from '@/app/lib/api/typingAPI';
import { rtdb } from '@/app/lib/firebase/FireClient';
import type { ChatMessage, FireCachedUser, MessageAttachment, ServerResult } from '@/app/lib/types';
import {
	compareMsgsAsc,
	genTempId,
	matchMessageContent,
	parseMessageFromSnapshot,
	parseTypingUserFromSnapshot,
} from '@/app/lib/utils/message/helper';
import type {
	MessagesServices,
	SnapshotCallback,
	UseMessagesOptions,
	UseMessagesReturn,
} from '@/app/lib/utils/message/types';

/* <------- CONSTANTS -------> */
const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_LIVE_LIMIT = 100;
const DEFAULT_MAX_MESSAGES = 500;
const DEFAULT_TYPING_DEBOUNCE_MS = 1200;
const TYPING_CLEAR_DELAY_MS = 200;
const OPTIMISTIC_FALLBACK_MS = 30_000;
const MAX_TEXT_LENGTH = 10000;
const MAX_EMOJI_LENGTH = 10;
const MAX_PAGINATION_LIMIT = 200;

/* <------- HOOK -------> */

export function useFireMessages(params: UseMessagesOptions): UseMessagesReturn {
	const { sessionId, userUid, services, options = {} } = params;

	const {
		initialLimit = DEFAULT_INITIAL_LIMIT,
		liveLimit = DEFAULT_LIVE_LIMIT,
		maxMessagesInMemory = DEFAULT_MAX_MESSAGES,
		typingProfile,
		typingDebounceMs = DEFAULT_TYPING_DEBOUNCE_MS,
	} = options;

	if (!sessionId?.trim()) throw new Error('[useFireMessages] sessionId is required');
	if (!userUid?.trim()) throw new Error('[useFireMessages] userUid is required');

	/* ---------- reactive state (minimal) ---------- */
	const [version, setVersion] = useState(0); // bump to trigger re-render of messages/typing arrays
	const [inFlightCount, setInFlightCount] = useState(0);

	/* ---------- refs (data stores) ---------- */
	const messagesMapRef = useRef<Map<string, ChatMessage>>(new Map());
	// optimisticTemp: tempId -> timeoutId
	const optimisticTempRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
	const typingUsersRef = useRef<Map<string, FireCachedUser>>(new Map());

	const isMountedRef = useRef<boolean>(true);
	const cleanupInProgressRef = useRef<boolean>(false);

	/* ---------- rtdb listener refs ---------- */
	const rtdbQueryRef = useRef<RTDBQuery | null>(null);
	const rtdbListenersRef = useRef<Record<string, SnapshotCallback | undefined>>({});
	const typingRefRef = useRef<ReturnType<typeof rtdbRef> | null>(null);

	/* ---------- typing timers ---------- */
	const typingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const typingClearTimerRef = useRef<NodeJS.Timeout | null>(null);
	const lastTypingSentRef = useRef<boolean | null>(null);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const triggerVersion = useCallback(() => {
		if (!isMountedRef.current || cleanupInProgressRef.current) return;
		setVersion((v) => v + 1);
	}, []);

	/* <------- RTDB: messages listeners -------> */
	useEffect(() => {
		if (!sessionId || !rtdb) return;

		const livePath = `liveMessages/${sessionId}`;
		const baseRef = rtdbRef(rtdb, livePath);
		const q: RTDBQuery = rtdbQuery(baseRef, limitToLast(liveLimit));
		rtdbQueryRef.current = q;

		const onAdd: SnapshotCallback = (snap) => {
			if (cleanupInProgressRef.current) return;
			try {
				const incoming = parseMessageFromSnapshot(snap, sessionId);
				if (!incoming?.id) return;

				// If a temp optimistic message exists that matches this server message, replace it.
				// This prevents duplicate rendering: find matching temp -> delete it -> insert server message.
				const entries = Array.from(messagesMapRef.current.entries());
				for (const [key, val] of entries) {
					if (key.startsWith('tmp_') && matchMessageContent(val, incoming)) {
						// cleanup temp timeout
						const t = optimisticTempRef.current.get(key);
						if (t) clearTimeout(t);
						optimisticTempRef.current.delete(key);
						messagesMapRef.current.delete(key);
						break; // only one match expected
					}
				}

				// Insert server message (overwrites if exists)
				messagesMapRef.current.set(incoming.id, incoming);
				triggerVersion();
			} catch {
				// parser failure - skip (silent per design)
			}
		};

		const onChange: SnapshotCallback = (snap) => {
			if (cleanupInProgressRef.current) return;
			try {
				const incoming = parseMessageFromSnapshot(snap, sessionId);
				if (!incoming?.id) return;
				// apply update directly (reactions, edits, status)
				messagesMapRef.current.set(incoming.id, incoming);
				triggerVersion();
			} catch {
				// skip invalid
			}
		};

		const onRem: SnapshotCallback = (snap) => {
			if (cleanupInProgressRef.current) return;
			try {
				const key = snap.key;
				if (!key) return;
				// remove message locally
				const existed = messagesMapRef.current.delete(key);
				// cleanup optimistic timer if present
				const t = optimisticTempRef.current.get(key);
				if (t) {
					clearTimeout(t);
					optimisticTempRef.current.delete(key);
				}
				if (existed) triggerVersion();
			} catch {
				// skip
			}
		};

		rtdbListenersRef.current.added = onAdd;
		rtdbListenersRef.current.changed = onChange;
		rtdbListenersRef.current.removed = onRem;

		onChildAdded(q, onAdd);
		onChildChanged(q, onChange);
		onChildRemoved(q, onRem);

		return () => {
			try {
				if (onAdd) rtdbOff(q, 'child_added', onAdd);
				if (onChange) rtdbOff(q, 'child_changed', onChange);
				if (onRem) rtdbOff(q, 'child_removed', onRem);
			} catch {
				// cleanup best-effort
			}
			rtdbQueryRef.current = null;
		};
	}, [sessionId, liveLimit, triggerVersion]);

	/* <------- RTDB: typing listeners -------> */
	useEffect(() => {
		if (!sessionId || !rtdb || !userUid) return;

		const typingPath = `liveSessions/${sessionId}/typing`;
		const tRef = rtdbRef(rtdb, typingPath);
		typingRefRef.current = tRef;

		const onTypingAdd: SnapshotCallback = (snap) => {
			if (cleanupInProgressRef.current) return;
			try {
				const user = parseTypingUserFromSnapshot(snap);
				if (!user?.uid || user.uid === userUid) return;
				typingUsersRef.current.set(user.uid, user);
				triggerVersion();
			} catch {
				// skip
			}
		};

		const onTypingChange: SnapshotCallback = (snap) => {
			if (cleanupInProgressRef.current) return;
			try {
				const user = parseTypingUserFromSnapshot(snap);
				if (!user?.uid || user.uid === userUid) return;
				typingUsersRef.current.set(user.uid, user);
				triggerVersion();
			} catch {
				// skip
			}
		};

		const onTypingRemove: SnapshotCallback = (snap) => {
			if (cleanupInProgressRef.current) return;
			try {
				const key = snap.key;
				if (!key) return;
				typingUsersRef.current.delete(key);
				triggerVersion();
			} catch {
				// skip
			}
		};

		rtdbListenersRef.current.typingAdded = onTypingAdd;
		rtdbListenersRef.current.typingChanged = onTypingChange;
		rtdbListenersRef.current.typingRemoved = onTypingRemove;

		onChildAdded(tRef, onTypingAdd);
		onChildChanged(tRef, onTypingChange);
		onChildRemoved(tRef, onTypingRemove);

		return () => {
			try {
				if (onTypingAdd) rtdbOff(tRef, 'child_added', onTypingAdd);
				if (onTypingChange) rtdbOff(tRef, 'child_changed', onTypingChange);
				if (onTypingRemove) rtdbOff(tRef, 'child_removed', onTypingRemove);
			} catch {
				// best-effort
			}
			typingRefRef.current = null;
		};
	}, [sessionId, userUid, triggerVersion]);

	/* <------- computed arrays -------> */
	const messages = useMemo(() => {
		const arr = Array.from(messagesMapRef.current.values());
		arr.sort(compareMsgsAsc);

		if (arr.length > maxMessagesInMemory) {
			const keep = arr.slice(-maxMessagesInMemory);
			// rebuild map asynchronously (non-blocking)
			queueMicrotask(() => {
				if (!isMountedRef.current || cleanupInProgressRef.current) return;
				messagesMapRef.current = new Map(keep.map((m) => [m.id!, m]));
			});
			return keep;
		}

		return arr;
	}, [version, maxMessagesInMemory]);

	const typingUsers = useMemo(() => {
		return Array.from(typingUsersRef.current.values()).filter((u) => u.uid !== userUid);
	}, [version, userUid]);

	/* <------- typing writes (debounced + dedupe) -------> */
	const writeTypingIndicator = useCallback(
		async (isTyping: boolean) => {
			if (!sessionId || !userUid) return;
			if (lastTypingSentRef.current === isTyping) return;
			lastTypingSentRef.current = isTyping;
			try {
				await setUserTyping({
					sessionId,
					userUid,
					displayName: typingProfile?.displayName ?? '',
					avatarUrl: typingProfile?.avatarUrl ?? null,
					isTyping,
				});
			} catch {
				// allow retry later
				lastTypingSentRef.current = null;
			}
		},
		[sessionId, userUid, typingProfile]
	);

	const setTyping = useCallback(
		(isTyping: boolean) => {
			if (typingClearTimerRef.current) {
				clearTimeout(typingClearTimerRef.current);
				typingClearTimerRef.current = null;
			}

			if (isTyping) {
				// start typing
				void writeTypingIndicator(true);
				if (typingDebounceTimerRef.current) clearTimeout(typingDebounceTimerRef.current);
				typingDebounceTimerRef.current = setTimeout(() => {
					void writeTypingIndicator(false);
					typingDebounceTimerRef.current = null;
				}, typingDebounceMs);
			} else {
				typingClearTimerRef.current = setTimeout(() => {
					if (typingDebounceTimerRef.current) {
						clearTimeout(typingDebounceTimerRef.current);
						typingDebounceTimerRef.current = null;
					}
					void writeTypingIndicator(false);
					typingClearTimerRef.current = null;
				}, TYPING_CLEAR_DELAY_MS);
			}
		},
		[writeTypingIndicator, typingDebounceMs]
	);

	/* <------- sendMessage (optimistic temp -> promote/rollback) -------> */
	const sendMessage = useCallback(
		async (
			text: string,
			replyTo?: string,
			attachments?: readonly MessageAttachment[]
		): Promise<ServerResult<ChatMessage>> => {
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing sessionId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}

			const trimmed = (text ?? '').trim();
			const hasText = Boolean(trimmed);
			const hasAttachments = Boolean(attachments?.length);

			if (!hasText && !hasAttachments) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'text or attachments required' };
			}
			if (trimmed && trimmed.length > MAX_TEXT_LENGTH) {
				return {
					ok: false,
					error: 'INVALID_INPUT',
					reason: `text too long (max ${MAX_TEXT_LENGTH})`,
				};
			}

			// create optimistic temp message
			const tempId = genTempId();
			const nowIso = new Date().toISOString();
			const tempMsg: ChatMessage = {
				id: tempId,
				roomId: sessionId,
				sessionId,
				sender: userUid,
				type: 'markdown',
				text: trimmed,
				replyTo: replyTo?.trim() || undefined,
				reactions: {},
				attachments: (attachments as MessageAttachment[]) || [],
				extras: undefined,
				status: 'sent',
				createdAt: nowIso,
			};

			// insert temp immediately
			messagesMapRef.current.set(tempId, tempMsg);

			// schedule fallback removal if promotion never arrives
			const fallback = setTimeout(() => {
				optimisticTempRef.current.delete(tempId);
				// remove temp if still present
				if (messagesMapRef.current.has(tempId)) {
					messagesMapRef.current.delete(tempId);
					triggerVersion();
				}
			}, OPTIMISTIC_FALLBACK_MS);
			optimisticTempRef.current.set(tempId, fallback);

			// UI update and in-flight
			triggerVersion();
			setInFlightCount((c) => c + 1);

			try {
				const res = await (services as MessagesServices).sendMessage({
					sessionId,
					senderUid: userUid,
					text: trimmed,
					replyTo: replyTo?.trim() || undefined,
					attachments: (attachments as MessageAttachment[]) || [],
				});

				if (!res.ok) {
					// rollback temp immediately
					const t = optimisticTempRef.current.get(tempId);
					if (t) clearTimeout(t);
					optimisticTempRef.current.delete(tempId);
					messagesMapRef.current.delete(tempId);
					triggerVersion();
					return res;
				}

				const t = optimisticTempRef.current.get(tempId);
				if (t) {
					clearTimeout(t);
					optimisticTempRef.current.delete(tempId);
				}
				// in case the server message already arrived via RTDB, ensure no duplicate:
				if (!messagesMapRef.current.has(res.data!.id!)) {
					messagesMapRef.current.delete(tempId);
					messagesMapRef.current.set(res.data!.id!, res.data!);
				} else {
					// if server already inserted, just remove temp
					messagesMapRef.current.delete(tempId);
				}
				triggerVersion();

				return res;
			} catch (err) {
				// network/unexpected: rollback temp
				const t = optimisticTempRef.current.get(tempId);
				if (t) clearTimeout(t);
				optimisticTempRef.current.delete(tempId);
				messagesMapRef.current.delete(tempId);
				triggerVersion();
				const reason = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'SEND_FAILED', reason };
			} finally {
				setInFlightCount((c) => Math.max(0, c - 1));
			}
		},
		[sessionId, userUid, services]
	);

	/* <------- fetchOlder (pagination) -------> */
	const fetchOlder = useCallback(
		async (beforeIso?: string, limit = initialLimit): Promise<ServerResult<ChatMessage[]>> => {
			if (!sessionId?.trim())
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing sessionId' };
			const safeLimit = Math.min(Math.max(1, limit), MAX_PAGINATION_LIMIT);

			try {
				const res = await (services as MessagesServices).getMessages({
					sessionId,
					limit: safeLimit,
					before: beforeIso?.trim() || undefined,
				});
				if (!res.ok) return res;

				let added = false;
				for (const m of res.data) {
					if (m?.id && !messagesMapRef.current.has(m.id)) {
						messagesMapRef.current.set(m.id, m);
						added = true;
					}
				}
				if (added) triggerVersion();
				return { ok: true, data: res.data };
			} catch (err) {
				const reason = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'FETCH_FAILED', reason };
			}
		},
		[sessionId, services, initialLimit]
	);

	/* <------- reactions (optimistic + rollback) -------> */
	const addReaction = useCallback(
		async (messageId: string, emoji: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim())
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			if (!userUid?.trim())
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			if (!emoji?.trim()) return { ok: false, error: 'INVALID_INPUT', reason: 'missing emoji' };
			if (emoji.length > MAX_EMOJI_LENGTH)
				return { ok: false, error: 'INVALID_INPUT', reason: `emoji too long` };

			const m = messagesMapRef.current.get(messageId);
			if (!m) return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };

			const prev = m.reactions ? { ...m.reactions } : {};
			const arr = Array.isArray(prev[emoji]) ? [...prev[emoji]] : [];
			if (arr.includes(userUid)) return { ok: true, data: null };

			arr.push(userUid);
			const next = { ...prev, [emoji]: arr };
			messagesMapRef.current.set(messageId, { ...m, reactions: next });
			triggerVersion();

			try {
				const res = await (services as MessagesServices).addReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});
				if (!res.ok) {
					messagesMapRef.current.set(messageId, {
						...m,
						reactions: Object.keys(prev).length ? prev : undefined,
					});
					triggerVersion();
				}
				return res;
			} catch (err) {
				messagesMapRef.current.set(messageId, {
					...m,
					reactions: Object.keys(prev).length ? prev : undefined,
				});
				triggerVersion();
				const reason = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_FAILED', reason };
			}
		},
		[services, userUid, sessionId]
	);

	const removeReaction = useCallback(
		async (messageId: string, emoji: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim())
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			if (!userUid?.trim())
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			if (!emoji?.trim()) return { ok: false, error: 'INVALID_INPUT', reason: 'missing emoji' };

			const m = messagesMapRef.current.get(messageId);
			if (!m) return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };

			const prev = m.reactions ? { ...m.reactions } : {};
			const arr = Array.isArray(prev[emoji]) ? [...prev[emoji]] : [];
			const idx = arr.indexOf(userUid);
			if (idx === -1) return { ok: true, data: null };

			arr.splice(idx, 1);
			const next = { ...prev };
			if (arr.length > 0) next[emoji] = arr;
			else delete next[emoji];

			messagesMapRef.current.set(messageId, {
				...m,
				reactions: Object.keys(next).length ? next : undefined,
			});
			triggerVersion();

			try {
				const res = await (services as MessagesServices).removeReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});
				if (!res.ok) {
					messagesMapRef.current.set(messageId, {
						...m,
						reactions: Object.keys(prev).length ? prev : undefined,
					});
					triggerVersion();
				}
				return res;
			} catch (err) {
				messagesMapRef.current.set(messageId, {
					...m,
					reactions: Object.keys(prev).length ? prev : undefined,
				});
				triggerVersion();
				const reason = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_REMOVE_FAILED', reason };
			}
		},
		[services, userUid, sessionId]
	);

	/* <------- delete message (optimistic) -------> */
	const deleteMessage = useCallback(
		async (messageId: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim())
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			if (!userUid?.trim())
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };

			const m = messagesMapRef.current.get(messageId);
			if (!m) return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };

			const backup = { ...m };
			messagesMapRef.current.delete(messageId);
			triggerVersion();

			try {
				const res = await (services as MessagesServices).deleteMessage({
					messageId,
					sessionId,
					callerUid: userUid,
				});
				if (!res.ok) {
					messagesMapRef.current.set(messageId, backup);
					triggerVersion();
				}
				return res;
			} catch (err) {
				messagesMapRef.current.set(messageId, backup);
				triggerVersion();
				const reason = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'DELETE_FAILED', reason };
			}
		},
		[services, userUid, sessionId]
	);

	/* <------- clear / cleanup -------> */
	const clear = useCallback(() => {
		cleanupInProgressRef.current = true;

		messagesMapRef.current.clear();
		typingUsersRef.current.clear();

		optimisticTempRef.current.forEach((t) => clearTimeout(t));
		optimisticTempRef.current.clear();

		if (typingDebounceTimerRef.current) {
			clearTimeout(typingDebounceTimerRef.current);
			typingDebounceTimerRef.current = null;
		}
		if (typingClearTimerRef.current) {
			clearTimeout(typingClearTimerRef.current);
			typingClearTimerRef.current = null;
		}

		// Remove listeners
		if (rtdbQueryRef.current) {
			const q = rtdbQueryRef.current;
			const listeners = rtdbListenersRef.current;
			try {
				if (listeners.added) rtdbOff(q, 'child_added', listeners.added);
				if (listeners.changed) rtdbOff(q, 'child_changed', listeners.changed);
				if (listeners.removed) rtdbOff(q, 'child_removed', listeners.removed);
			} catch {
				// best-effort
			}
			rtdbQueryRef.current = null;
		}

		if (typingRefRef.current) {
			const tRef = typingRefRef.current;
			const listeners = rtdbListenersRef.current;
			try {
				if (listeners.typingAdded) rtdbOff(tRef, 'child_added', listeners.typingAdded);
				if (listeners.typingChanged) rtdbOff(tRef, 'child_changed', listeners.typingChanged);
				if (listeners.typingRemoved) rtdbOff(tRef, 'child_removed', listeners.typingRemoved);
			} catch {
				// best-effort
			}
			typingRefRef.current = null;
		}

		// Clear typing indicator server-side
		if (sessionId?.trim() && userUid?.trim()) {
			void clearUserTyping({ sessionId, userUid }).catch(() => {
				/* ignore */
			});
		}

		// reset reactive state
		if (isMountedRef.current) {
			setVersion(0);
			setInFlightCount(0);
		}

		// release cleanup flag shortly after
		setTimeout(() => {
			cleanupInProgressRef.current = false;
		}, 100);
	}, [sessionId, userUid]);

	useEffect(() => {
		return () => {
			clear();
		};
	}, [clear]);

	/* <------- public API -------> */
	return {
		messages,
		sending: inFlightCount > 0,
		inFlightCount,
		typingUsers,
		setTyping,
		sendMessage,
		fetchOlder,
		addReaction,
		removeReaction,
		deleteMessage,
		clear,
	};
}
