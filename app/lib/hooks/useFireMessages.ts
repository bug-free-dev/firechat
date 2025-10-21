'use client';

import {
	type DataSnapshot,
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
import type { ChatMessage, FireCachedUser, ServerResult } from '@/app/lib/types';
import {
	compareMsgsAsc,
	parseMessageFromSnapshot,
	parseTypingUserFromSnapshot,
} from '@/app/lib/utils/message/helpers';
import type {
	RTDBListeners,
	SnapshotCallback,
	UseMessagesOptions,
	UseMessagesReturn,
} from '@/app/lib/utils/message/typeDefs';

/* <----------- CONSTANTS -----------> */
const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_LIVE_LIMIT = 100;
const DEFAULT_MAX_MESSAGES = 500;
const DEFAULT_TYPING_DEBOUNCE_MS = 1200;
const TYPING_CLEAR_DELAY_MS = 200;
const OPTIMISTIC_SYNC_DELAY_MS = 2000;

/* <----------- INTERFACES -----------> */
interface MessageState {
	version: number;
	sending: boolean;
	inFlightCount: number;
}

interface TypingState {
	version: number;
	isActive: boolean;
}

/* <----------- HOOK -----------> */

export function useFireMessages(params: UseMessagesOptions): UseMessagesReturn {
	const { sessionId, userUid, services, options = {} } = params;

	const {
		initialLimit = DEFAULT_INITIAL_LIMIT,
		liveLimit = DEFAULT_LIVE_LIMIT,
		maxMessagesInMemory = DEFAULT_MAX_MESSAGES,
		typingProfile,
		typingDebounceMs = DEFAULT_TYPING_DEBOUNCE_MS,
	} = options;

	// Validate required params
	if (!sessionId?.trim()) {
		throw new Error('[useFireMessages] sessionId is required');
	}
	if (!userUid?.trim()) {
		throw new Error('[useFireMessages] userUid is required');
	}

	// State
	const [messageState, setMessageState] = useState<MessageState>({
		version: 0,
		sending: false,
		inFlightCount: 0,
	});
	const [typingState, setTypingState] = useState<TypingState>({
		version: 0,
		isActive: false,
	});

	// Refs - Data stores
	const messagesMapRef = useRef<Map<string, ChatMessage>>(new Map());
	const pendingMessagesRef = useRef<Set<string>>(new Set());
	const typingUsersMapRef = useRef<Map<string, FireCachedUser>>(new Map());
	const isMountedRef = useRef<boolean>(true);

	// Refs - RTDB
	const rtdbQueryRef = useRef<RTDBQuery | null>(null);
	const rtdbListenersRef = useRef<RTDBListeners>({});
	const typingRefRef = useRef<ReturnType<typeof rtdbRef> | null>(null);

	// Refs - Typing timers
	const typingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const typingClearTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Refs - Cleanup flags
	const cleanupInProgressRef = useRef<boolean>(false);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	/* <----------- COMPUTED VALUES -----------> */

	const messages = useMemo<ChatMessage[]>(() => {
		const allMessages = Array.from(messagesMapRef.current.values());
		allMessages.sort(compareMsgsAsc);

		// Memory management - keep only recent messages
		if (allMessages.length > maxMessagesInMemory) {
			const keep = allMessages.slice(allMessages.length - maxMessagesInMemory);
			messagesMapRef.current = new Map(keep.map((m) => [m.id!, m]));
			return keep;
		}

		return allMessages;
	}, [messageState.version, maxMessagesInMemory]);

	const typingUsers = useMemo<FireCachedUser[]>(() => {
		return Array.from(typingUsersMapRef.current.values()).filter((user) => user.uid !== userUid);
	}, [typingState.version, userUid]);

	/* <----------- STATE TRIGGERS -----------> */

	const triggerMessagesUpdate = useCallback((): void => {
		if (isMountedRef.current && !cleanupInProgressRef.current) {
			setMessageState((prev) => ({
				...prev,
				version: prev.version + 1,
			}));
		}
	}, []);

	const triggerTypingUpdate = useCallback((): void => {
		if (isMountedRef.current && !cleanupInProgressRef.current) {
			setTypingState((prev) => ({
				...prev,
				version: prev.version + 1,
			}));
		}
	}, []);

	const updateInFlightCount = useCallback((delta: number): void => {
		if (isMountedRef.current && !cleanupInProgressRef.current) {
			setMessageState((prev) => {
				const newCount = Math.max(0, prev.inFlightCount + delta);
				return {
					...prev,
					inFlightCount: newCount,
					sending: newCount > 0,
				};
			});
		}
	}, []);

	/* <----------- LOCAL MESSAGE UPDATES -----------> */

	const upsertMessageLocal = useCallback(
		(msg: ChatMessage): void => {
			if (!msg.id?.trim()) {
				return;
			}

			const existing = messagesMapRef.current.get(msg.id);

			// Skip if identical (deep comparison for efficiency)
			if (existing && JSON.stringify(existing) === JSON.stringify(msg)) {
				return;
			}

			// Skip if pending (optimistic update already applied)
			if (pendingMessagesRef.current.has(msg.id)) {
				pendingMessagesRef.current.delete(msg.id);
			}

			messagesMapRef.current.set(msg.id, msg);
			triggerMessagesUpdate();
		},
		[triggerMessagesUpdate]
	);

	const removeMessageLocal = useCallback(
		(msgId: string): void => {
			if (!msgId?.trim() || !messagesMapRef.current.has(msgId)) {
				return;
			}

			messagesMapRef.current.delete(msgId);
			pendingMessagesRef.current.delete(msgId);
			triggerMessagesUpdate();
		},
		[triggerMessagesUpdate]
	);

	/* <----------- RTDB: LIVE MESSAGES LISTENERS -----------> */

	useEffect(() => {
		if (!sessionId || !rtdb) return;

		const livePath = `liveMessages/${sessionId}`;
		const baseRef = rtdbRef(rtdb, livePath);
		const q: RTDBQuery = rtdbQuery(baseRef, limitToLast(liveLimit));
		rtdbQueryRef.current = q;

		const onAdd: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const incoming = parseMessageFromSnapshot(snap, sessionId);
				if (incoming?.id) {
					upsertMessageLocal(incoming);
				}
			} catch {
				/**Ignore*/
			}
		};

		const onChange: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const incoming = parseMessageFromSnapshot(snap, sessionId);
				if (!incoming?.id?.trim()) return;

				messagesMapRef.current.set(incoming.id, incoming);
				triggerMessagesUpdate();
			} catch {
				/**Ignore */
			}
		};

		const onRem: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const { key } = snap;
				if (key?.trim()) {
					removeMessageLocal(key);
				}
			} catch {
				/**Ignore */
			}
		};

		const listeners: RTDBListeners = {
			added: onAdd,
			changed: onChange,
			removed: onRem,
		};
		rtdbListenersRef.current = listeners;

		onChildAdded(q, onAdd);
		onChildChanged(q, onChange);
		onChildRemoved(q, onRem);

		return (): void => {
			try {
				if (listeners.added) rtdbOff(q, 'child_added', listeners.added);
				if (listeners.changed) rtdbOff(q, 'child_changed', listeners.changed);
				if (listeners.removed) rtdbOff(q, 'child_removed', listeners.removed);
			} catch {}
		};
	}, [sessionId, liveLimit, upsertMessageLocal, removeMessageLocal, triggerMessagesUpdate]);

	/* <----------- RTDB: TYPING INDICATORS LISTENERS -----------> */

	useEffect(() => {
		if (!sessionId || !rtdb || !userUid) return;

		const typingPath = `liveSessions/${sessionId}/typing`;
		const tRef = rtdbRef(rtdb, typingPath);
		typingRefRef.current = tRef;

		const onTypingAdd: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const user = parseTypingUserFromSnapshot(snap);
				if (!user?.uid || user.uid === userUid) return;

				typingUsersMapRef.current.set(user.uid, user);
				triggerTypingUpdate();
			} catch {}
		};

		const onTypingChange: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const user = parseTypingUserFromSnapshot(snap);
				if (!user?.uid || user.uid === userUid) return;

				typingUsersMapRef.current.set(user.uid, user);
				triggerTypingUpdate();
			} catch {}
		};

		const onTypingRemove: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const { key } = snap;
				if (!key || !typingUsersMapRef.current.has(key)) return;

				typingUsersMapRef.current.delete(key);
				triggerTypingUpdate();
			} catch {}
		};

		const typingListeners: RTDBListeners = {
			typingAdded: onTypingAdd,
			typingChanged: onTypingChange,
			typingRemoved: onTypingRemove,
		};
		rtdbListenersRef.current = { ...rtdbListenersRef.current, ...typingListeners };

		onChildAdded(tRef, onTypingAdd);
		onChildChanged(tRef, onTypingChange);
		onChildRemoved(tRef, onTypingRemove);

		return (): void => {
			try {
				if (typingListeners.typingAdded)
					rtdbOff(tRef, 'child_added', typingListeners.typingAdded);
				if (typingListeners.typingChanged)
					rtdbOff(tRef, 'child_changed', typingListeners.typingChanged);
				if (typingListeners.typingRemoved)
					rtdbOff(tRef, 'child_removed', typingListeners.typingRemoved);
			} catch {
				/* empty */
			}
		};
	}, [sessionId, userUid, triggerTypingUpdate]);

	/* <----------- TYPING INDICATOR (Server-Side Write) -----------> */

	const writeTypingIndicator = useCallback(
		async (isTyping: boolean): Promise<void> => {
			if (!sessionId?.trim() || !userUid?.trim()) return;

			try {
				await setUserTyping({
					sessionId,
					userUid,
					displayName: typingProfile?.displayName ?? '',
					avatarUrl: typingProfile?.avatarUrl ?? null,
					isTyping,
				});
			} catch {}
		},
		[sessionId, userUid, typingProfile]
	);

	const setTyping = useCallback(
		(isTyping: boolean): void => {
			// Clear any pending clear timer
			if (typingClearTimerRef.current) {
				clearTimeout(typingClearTimerRef.current);
				typingClearTimerRef.current = null;
			}

			if (isTyping) {
				// Only write if not already active
				if (!typingState.isActive) {
					setTypingState((prev) => ({ ...prev, isActive: true }));
					void writeTypingIndicator(true);
				}

				// Reset debounce timer
				if (typingDebounceTimerRef.current) {
					clearTimeout(typingDebounceTimerRef.current);
				}

				typingDebounceTimerRef.current = setTimeout(() => {
					setTypingState((prev) => ({ ...prev, isActive: false }));
					void writeTypingIndicator(false);
					typingDebounceTimerRef.current = null;
				}, typingDebounceMs);
			} else {
				// Clear immediately with slight delay to batch rapid calls
				typingClearTimerRef.current = setTimeout(() => {
					if (typingDebounceTimerRef.current) {
						clearTimeout(typingDebounceTimerRef.current);
						typingDebounceTimerRef.current = null;
					}
					setTypingState((prev) => ({ ...prev, isActive: false }));
					void writeTypingIndicator(false);
					typingClearTimerRef.current = null;
				}, TYPING_CLEAR_DELAY_MS);
			}
		},
		[writeTypingIndicator, typingDebounceMs, typingState.isActive]
	);

	/* <----------- SEND MESSAGE -----------> */

	const sendMessage = useCallback(
		async (
			text: string,
			replyTo?: string,
			extras?: Record<string, unknown>
		): Promise<ServerResult<ChatMessage>> => {
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing sessionId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}

			const trimmedText = text?.trim();
			if (!trimmedText) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'text required' };
			}

			// Security: Validate text length
			if (trimmedText.length > 10000) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'text too long (max 10000 chars)' };
			}

			updateInFlightCount(1);

			try {
				const res = await services.sendMessage({
					sessionId,
					senderUid: userUid,
					text: trimmedText,
					replyTo: replyTo?.trim() || undefined,
					extras,
				});

				if (!res.ok) return res;

				// Optimistic update
				if (res.data?.id?.trim()) {
					pendingMessagesRef.current.add(res.data.id);
					messagesMapRef.current.set(res.data.id, res.data);
					triggerMessagesUpdate();

					// Clear pending flag after RTDB sync
					setTimeout(() => {
						if (res.data?.id) {
							pendingMessagesRef.current.delete(res.data.id);
						}
					}, OPTIMISTIC_SYNC_DELAY_MS);
				}

				return res;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'SEND_FAILED', reason: errorMessage };
			} finally {
				updateInFlightCount(-1);
			}
		},
		[sessionId, userUid, services, triggerMessagesUpdate, updateInFlightCount]
	);

	/* <----------- FETCH OLDER MESSAGES -----------> */

	const fetchOlder = useCallback(
		async (
			beforeIso?: string,
			limit: number = initialLimit
		): Promise<ServerResult<ChatMessage[]>> => {
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing sessionId' };
			}

			// Security: Validate limit
			const safeLimit = Math.min(Math.max(1, limit), 200);

			try {
				const res = await services.getMessages({
					sessionId,
					limit: safeLimit,
					before: beforeIso?.trim() || undefined,
				});

				if (!res.ok) return res;

				let hasNewMessages = false;
				for (const m of res.data) {
					if (m?.id?.trim() && !messagesMapRef.current.has(m.id)) {
						messagesMapRef.current.set(m.id, m);
						hasNewMessages = true;
					}
				}

				if (hasNewMessages) {
					triggerMessagesUpdate();
				}

				return { ok: true, data: res.data };
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'FETCH_FAILED', reason: errorMessage };
			}
		},
		[sessionId, services, initialLimit, triggerMessagesUpdate]
	);

	/* <----------- REACTIONS -----------> */

	const addReaction = useCallback(
		async (messageId: string, emoji: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}
			if (!emoji?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing emoji' };
			}

			// Security: Validate emoji (basic check)
			if (emoji.length > 10) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'emoji too long' };
			}

			const m = messagesMapRef.current.get(messageId);
			if (!m) {
				return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };
			}

			const prevReactions = { ...(m.reactions ?? {}) };
			const arr = Array.isArray(prevReactions[emoji]) ? [...prevReactions[emoji]] : [];

			if (arr.includes(userUid)) {
				return { ok: true, data: null };
			}

			// Optimistic update
			arr.push(userUid);
			const updatedMessage = { ...m, reactions: { ...prevReactions, [emoji]: arr } };
			messagesMapRef.current.set(messageId, updatedMessage);
			triggerMessagesUpdate();

			try {
				const res = await services.addReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});

				if (!res.ok) {
					// Rollback on failure
					const rollback = messagesMapRef.current.get(messageId);
					if (rollback) {
						messagesMapRef.current.set(messageId, { ...rollback, reactions: prevReactions });
						triggerMessagesUpdate();
					}
				}
				return res;
			} catch (err) {
				// Rollback on error
				const rollback = messagesMapRef.current.get(messageId);
				if (rollback) {
					messagesMapRef.current.set(messageId, { ...rollback, reactions: prevReactions });
					triggerMessagesUpdate();
				}
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId, triggerMessagesUpdate]
	);

	const removeReaction = useCallback(
		async (messageId: string, emoji: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}
			if (!emoji?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing emoji' };
			}

			const m = messagesMapRef.current.get(messageId);
			if (!m) {
				return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };
			}

			const prevReactions = { ...(m.reactions ?? {}) };
			const arr = Array.isArray(prevReactions[emoji]) ? [...prevReactions[emoji]] : [];
			const idx = arr.indexOf(userUid);

			if (idx === -1) {
				return { ok: true, data: null };
			}

			// Optimistic update
			arr.splice(idx, 1);
			const nextReactions = { ...prevReactions };
			if (arr.length > 0) {
				nextReactions[emoji] = arr;
			} else {
				delete nextReactions[emoji];
			}

			const updatedMessage = {
				...m,
				reactions: Object.keys(nextReactions).length ? nextReactions : {},
			};
			messagesMapRef.current.set(messageId, updatedMessage);
			triggerMessagesUpdate();

			try {
				const res = await services.removeReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});

				if (!res.ok) {
					// Rollback on failure
					const rollback = messagesMapRef.current.get(messageId);
					if (rollback) {
						messagesMapRef.current.set(messageId, { ...rollback, reactions: prevReactions });
						triggerMessagesUpdate();
					}
				}
				return res;
			} catch (err) {
				// Rollback on error
				const rollback = messagesMapRef.current.get(messageId);
				if (rollback) {
					messagesMapRef.current.set(messageId, { ...rollback, reactions: prevReactions });
					triggerMessagesUpdate();
				}
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_REMOVE_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId, triggerMessagesUpdate]
	);

	/* <----------- DELETE MESSAGE -----------> */

	const deleteMessage = useCallback(
		async (messageId: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}

			const m = messagesMapRef.current.get(messageId);
			if (!m) {
				return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };
			}

			// Optimistic removal
			const backup = { ...m };
			removeMessageLocal(messageId);

			try {
				const res = await services.deleteMessage({
					messageId,
					sessionId,
					callerUid: userUid,
				});

				if (!res.ok) {
					// Rollback on failure
					messagesMapRef.current.set(messageId, backup);
					triggerMessagesUpdate();
				}

				return res;
			} catch (err) {
				// Rollback on error
				messagesMapRef.current.set(messageId, backup);
				triggerMessagesUpdate();
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'DELETE_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId, removeMessageLocal, triggerMessagesUpdate]
	);

	/* <----------- CLEANUP -----------> */

	const clear = useCallback((): void => {
		cleanupInProgressRef.current = true;

		// Clear data structures
		messagesMapRef.current.clear();
		pendingMessagesRef.current.clear();
		typingUsersMapRef.current.clear();

		// Clear state
		if (isMountedRef.current) {
			setMessageState({ version: 0, sending: false, inFlightCount: 0 });
			setTypingState({ version: 0, isActive: false });
		}

		// Clear timers
		if (typingDebounceTimerRef.current) {
			clearTimeout(typingDebounceTimerRef.current);
			typingDebounceTimerRef.current = null;
		}
		if (typingClearTimerRef.current) {
			clearTimeout(typingClearTimerRef.current);
			typingClearTimerRef.current = null;
		}

		// Cleanup RTDB message listeners
		if (rtdbQueryRef.current) {
			const q = rtdbQueryRef.current;
			const listeners = rtdbListenersRef.current;

			try {
				if (listeners.added) rtdbOff(q, 'child_added', listeners.added);
				if (listeners.changed) rtdbOff(q, 'child_changed', listeners.changed);
				if (listeners.removed) rtdbOff(q, 'child_removed', listeners.removed);
			} catch {}
		}

		// Cleanup RTDB typing listeners
		if (typingRefRef.current) {
			const tRef = typingRefRef.current;
			const listeners = rtdbListenersRef.current;

			try {
				if (listeners.typingAdded) rtdbOff(tRef, 'child_added', listeners.typingAdded);
				if (listeners.typingChanged) rtdbOff(tRef, 'child_changed', listeners.typingChanged);
				if (listeners.typingRemoved) rtdbOff(tRef, 'child_removed', listeners.typingRemoved);
			} catch {}
		}

		// Clear typing indicator on server
		if (sessionId?.trim() && userUid?.trim()) {
			void clearUserTyping({ sessionId, userUid });
		}

		// Reset cleanup flag after a delay
		setTimeout(() => {
			cleanupInProgressRef.current = false;
		}, 100);
	}, [sessionId, userUid]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			clear();
		};
	}, [clear]);

	/* <----------- RETURN -----------> */

	return {
		messages,
		sending: messageState.sending,
		inFlightCount: messageState.inFlightCount,
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
