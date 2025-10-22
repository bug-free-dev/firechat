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
	createOptimisticMessage,
	parseMessageFromSnapshot,
	parseTypingUserFromSnapshot,
} from '@/app/lib/utils/message/helpers';
import type {
   OptimisticMessage,
   OptimisticOperation,
	RTDBListeners,
	SnapshotCallback,
	UseMessagesOptions,
	UseMessagesReturn,
} from '@/app/lib/utils/message/typeDefs';
import { toMillis } from '@/app/lib/utils/time';

/* <----------- CONSTANTS -----------> */
const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_LIVE_LIMIT = 100;
const DEFAULT_MAX_MESSAGES = 500;
const DEFAULT_TYPING_DEBOUNCE_MS = 1200;
const TYPING_CLEAR_DELAY_MS = 200;
const OPTIMISTIC_TIMEOUT_MS = 5000;
const OPTIMISTIC_MATCH_THRESHOLD_MS = 3000;
const MAX_TEXT_LENGTH = 10000;
const MAX_LIMIT = 200;
const MAX_EMOJI_LENGTH = 10;

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

	// State - Optimized for minimal re-renders
	const [messageVersion, setMessageVersion] = useState(0);
	const [inFlightCount, setInFlightCount] = useState(0);
	const [typingVersion, setTypingVersion] = useState(0);

	// Refs - Core data stores
	const messagesMapRef = useRef<Map<string, ChatMessage | OptimisticMessage>>(new Map());
	const optimisticOpsRef = useRef<Map<string, OptimisticOperation>>(new Map());
	const typingUsersMapRef = useRef<Map<string, FireCachedUser>>(new Map());
	const isMountedRef = useRef(true);

	// Refs - RTDB
	const rtdbQueryRef = useRef<RTDBQuery | null>(null);
	const rtdbListenersRef = useRef<RTDBListeners>({});
	const typingRefRef = useRef<ReturnType<typeof rtdbRef> | null>(null);

	// Refs - Typing timers
	const typingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const typingClearTimerRef = useRef<NodeJS.Timeout | null>(null);
	const isTypingActiveRef = useRef(false);

	// Refs - Performance optimizations
	const cleanupInProgressRef = useRef(false);
	const messagesCacheRef = useRef<ChatMessage[] | null>(null);
	const typingCacheRef = useRef<FireCachedUser[] | null>(null);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	/* <----------- STATE TRIGGERS - OPTIMIZED -----------> */

	const triggerMessagesUpdate = useCallback((): void => {
		if (!isMountedRef.current || cleanupInProgressRef.current) return;
		messagesCacheRef.current = null;
		setMessageVersion((v) => v + 1);
	}, []);

	const triggerTypingUpdate = useCallback((): void => {
		if (!isMountedRef.current || cleanupInProgressRef.current) return;
		typingCacheRef.current = null;
		setTypingVersion((v) => v + 1);
	}, []);

	const updateInFlightCount = useCallback((delta: number): void => {
		if (!isMountedRef.current || cleanupInProgressRef.current) return;
		setInFlightCount((prev) => Math.max(0, prev + delta));
	}, []);

	/* <----------- OPTIMISTIC OPERATIONS MANAGEMENT -----------> */

	const addOptimisticOp = useCallback(
		(op: OptimisticOperation): void => {
			optimisticOpsRef.current.set(op.id, op);

			// Auto-cleanup old optimistic operations
			setTimeout(() => {
				const existing = optimisticOpsRef.current.get(op.id);
				if (existing && Date.now() - existing.timestamp > OPTIMISTIC_TIMEOUT_MS) {
					existing.rollback?.();
					optimisticOpsRef.current.delete(op.id);
					triggerMessagesUpdate();
				}
			}, OPTIMISTIC_TIMEOUT_MS);
		},
		[triggerMessagesUpdate]
	);

	const resolveOptimisticOp = useCallback((id: string, success: boolean): void => {
		const op = optimisticOpsRef.current.get(id);
		if (!op) return;

		if (!success) {
			op.rollback?.();
		}
		optimisticOpsRef.current.delete(id);
	}, []);

	/* <----------- MESSAGE OPERATIONS - FULLY OPTIMISTIC -----------> */

	const upsertMessageLocal = useCallback(
		(msg: ChatMessage): void => {
			if (!msg?.id?.trim()) return;

			const existing = messagesMapRef.current.get(msg.id);

			// Replace optimistic message with real one
			if (existing && '_optimistic' in existing && !('_optimistic' in msg)) {
				messagesMapRef.current.set(msg.id, msg);
				triggerMessagesUpdate();
				return;
			}

			// Skip if identical (performance optimization)
			if (
				existing &&
				!('_optimistic' in existing) &&
				toMillis(existing.createdAt) === toMillis(msg.createdAt) &&
				JSON.stringify(existing.reactions) === JSON.stringify(msg.reactions)
			) {
				return;
			}

			messagesMapRef.current.set(msg.id, msg);
			triggerMessagesUpdate();
		},
		[triggerMessagesUpdate]
	);

	const removeMessageLocal = useCallback(
		(msgId: string): void => {
			if (!msgId?.trim() || !messagesMapRef.current.has(msgId)) return;
			messagesMapRef.current.delete(msgId);
			triggerMessagesUpdate();
		},
		[triggerMessagesUpdate]
	);

	/* <----------- COMPUTED VALUES - CACHED -----------> */

	const messages = useMemo<ChatMessage[]>(() => {
		if (messagesCacheRef.current) return messagesCacheRef.current;

		const allMessages = Array.from(messagesMapRef.current.values()) as ChatMessage[];
		allMessages.sort(compareMsgsAsc);

		// Memory management
		if (allMessages.length > maxMessagesInMemory) {
			const keep = allMessages.slice(-maxMessagesInMemory);
			messagesMapRef.current = new Map(keep.map((m) => [m.id!, m]));
			messagesCacheRef.current = keep;
			return keep;
		}

		messagesCacheRef.current = allMessages;
		return allMessages;
	}, [messageVersion, maxMessagesInMemory]);

	const typingUsers = useMemo<FireCachedUser[]>(() => {
		if (typingCacheRef.current) return typingCacheRef.current;

		const users = Array.from(typingUsersMapRef.current.values()).filter(
			(user) => user.uid !== userUid
		);

		typingCacheRef.current = users;
		return users;
	}, [typingVersion, userUid]);

	const sending = useMemo(() => inFlightCount > 0, [inFlightCount]);

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
				if (!incoming?.id) return;

				// Find and resolve optimistic message
				const optimisticMsg = Array.from(messagesMapRef.current.values()).find((m) => {
					if (!('_optimistic' in m)) return false;
					const opt = m as OptimisticMessage;
					return (
						opt.text === incoming.text &&
						opt.sender === incoming.sender &&
						Math.abs(toMillis(opt.createdAt) - toMillis(incoming.createdAt)) <
							OPTIMISTIC_MATCH_THRESHOLD_MS
					);
				});

				if (optimisticMsg?.id) {
					messagesMapRef.current.delete(optimisticMsg.id);
					resolveOptimisticOp(optimisticMsg.id, true);
				}

				upsertMessageLocal(incoming);
			} catch {
				// Silently fail
			}
		};

		const onChange: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const incoming = parseMessageFromSnapshot(snap, sessionId);
				if (incoming?.id) {
					upsertMessageLocal(incoming);
				}
			} catch {
				// Silently fail
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
				// Silently fail
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
			} catch {
				// Silently fail
			}
		};
	}, [sessionId, liveLimit, upsertMessageLocal, removeMessageLocal, resolveOptimisticOp]);

	/* <----------- RTDB: TYPING INDICATORS -----------> */

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
			} catch {
				// Silently fail
			}
		};

		const onTypingChange: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const user = parseTypingUserFromSnapshot(snap);
				if (!user?.uid || user.uid === userUid) return;

				typingUsersMapRef.current.set(user.uid, user);
				triggerTypingUpdate();
			} catch {
				// Silently fail
			}
		};

		const onTypingRemove: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const { key } = snap;
				if (!key || !typingUsersMapRef.current.has(key)) return;

				typingUsersMapRef.current.delete(key);
				triggerTypingUpdate();
			} catch {
				// Silently fail
			}
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
				// Silently fail
			}
		};
	}, [sessionId, userUid, triggerTypingUpdate]);

	/* <----------- TYPING INDICATOR -----------> */

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
			} catch {
				// Silently fail
			}
		},
		[sessionId, userUid, typingProfile]
	);

	const setTyping = useCallback(
		(isTyping: boolean): void => {
			if (typingClearTimerRef.current) {
				clearTimeout(typingClearTimerRef.current);
				typingClearTimerRef.current = null;
			}

			if (isTyping) {
				if (!isTypingActiveRef.current) {
					isTypingActiveRef.current = true;
					void writeTypingIndicator(true);
				}

				if (typingDebounceTimerRef.current) {
					clearTimeout(typingDebounceTimerRef.current);
				}

				typingDebounceTimerRef.current = setTimeout(() => {
					isTypingActiveRef.current = false;
					void writeTypingIndicator(false);
					typingDebounceTimerRef.current = null;
				}, typingDebounceMs);
			} else {
				typingClearTimerRef.current = setTimeout(() => {
					if (typingDebounceTimerRef.current) {
						clearTimeout(typingDebounceTimerRef.current);
						typingDebounceTimerRef.current = null;
					}
					isTypingActiveRef.current = false;
					void writeTypingIndicator(false);
					typingClearTimerRef.current = null;
				}, TYPING_CLEAR_DELAY_MS);
			}
		},
		[writeTypingIndicator, typingDebounceMs]
	);

	/* <----------- SEND MESSAGE - TRUE OPTIMISTIC -----------> */

	const sendMessage = useCallback(
		async (
			text: string,
			replyTo?: string,
			extras?: Record<string, unknown>
		): Promise<ServerResult<ChatMessage>> => {
			// Validation
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

			if (trimmedText.length > MAX_TEXT_LENGTH) {
				return {
					ok: false,
					error: 'INVALID_INPUT',
					reason: `text too long (max ${MAX_TEXT_LENGTH} chars)`,
				};
			}

			// Create optimistic message IMMEDIATELY
			const optimisticMsg = createOptimisticMessage(
				trimmedText,
				userUid,
				sessionId,
				replyTo?.trim(),
				extras
			);

			// Add to UI instantly
			messagesMapRef.current.set(optimisticMsg?.id, optimisticMsg);
			triggerMessagesUpdate();

			// Track operation
			const rollback = () => {
				messagesMapRef.current.delete(optimisticMsg.id);
			};

			addOptimisticOp({
				id: optimisticMsg.id,
				type: 'send',
				timestamp: Date.now(),
				rollback,
			});

			updateInFlightCount(1);

			try {
				const res = await services.sendMessage({
					sessionId,
					senderUid: userUid,
					text: trimmedText,
					replyTo: replyTo?.trim() || undefined,
					extras,
				});

				if (!res.ok) {
					resolveOptimisticOp(optimisticMsg.id, false);
					triggerMessagesUpdate();
					return res;
				}

				resolveOptimisticOp(optimisticMsg.id, true);
				return res;
			} catch (err) {
				resolveOptimisticOp(optimisticMsg.id, false);
				triggerMessagesUpdate();

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'SEND_FAILED', reason: errorMessage };
			} finally {
				updateInFlightCount(-1);
			}
		},
		[
			sessionId,
			userUid,
			services,
			triggerMessagesUpdate,
			updateInFlightCount,
			addOptimisticOp,
			resolveOptimisticOp,
		]
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

			const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);

			try {
				const res = await services.getMessages({
					sessionId,
					limit: safeLimit,
					before: beforeIso?.trim() || undefined,
				});

				if (!res.ok) return res;

				// Batch update
				let hasNewMessages = false;
				const updates: [string, ChatMessage][] = [];

				for (const m of res.data) {
					if (m?.id?.trim() && !messagesMapRef.current.has(m.id)) {
						updates.push([m.id, m]);
						hasNewMessages = true;
					}
				}

				if (hasNewMessages) {
					for (const [id, msg] of updates) {
						messagesMapRef.current.set(id, msg);
					}
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

	/* <----------- REACTIONS - TRUE OPTIMISTIC -----------> */

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
			if (emoji.length > MAX_EMOJI_LENGTH) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'emoji too long' };
			}

			const m = messagesMapRef.current.get(messageId);
			if (!m) {
				return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };
			}

			const prevReactions = m.reactions ?? {};
			const arr = Array.isArray(prevReactions[emoji]) ? [...prevReactions[emoji]] : [];

			if (arr.includes(userUid)) {
				return { ok: true, data: null };
			}

			// Optimistic update
			arr.push(userUid);
			const optimisticMsg = { ...m, reactions: { ...prevReactions, [emoji]: arr } };
			messagesMapRef.current.set(messageId, optimisticMsg);
			triggerMessagesUpdate();

			const rollback = () => {
				messagesMapRef.current.set(messageId, m);
			};

			const opId = `react_add_${messageId}_${emoji}_${Date.now()}`;
			addOptimisticOp({ id: opId, type: 'react_add', timestamp: Date.now(), rollback });

			try {
				const res = await services.addReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});

				resolveOptimisticOp(opId, res.ok);

				if (!res.ok) {
					triggerMessagesUpdate();
				}

				return res;
			} catch (err) {
				resolveOptimisticOp(opId, false);
				triggerMessagesUpdate();

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId, triggerMessagesUpdate, addOptimisticOp, resolveOptimisticOp]
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

			const prevReactions = m.reactions ?? {};
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

			const optimisticMsg = {
				...m,
				reactions: Object.keys(nextReactions).length ? nextReactions : {},
			};
			messagesMapRef.current.set(messageId, optimisticMsg);
			triggerMessagesUpdate();

			const rollback = () => {
				messagesMapRef.current.set(messageId, m);
			};

			const opId = `react_remove_${messageId}_${emoji}_${Date.now()}`;
			addOptimisticOp({ id: opId, type: 'react_remove', timestamp: Date.now(), rollback });

			try {
				const res = await services.removeReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});

				resolveOptimisticOp(opId, res.ok);

				if (!res.ok) {
					triggerMessagesUpdate();
				}

				return res;
			} catch (err) {
				resolveOptimisticOp(opId, false);
				triggerMessagesUpdate();

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_REMOVE_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId, triggerMessagesUpdate, addOptimisticOp, resolveOptimisticOp]
	);

	/* <----------- DELETE MESSAGE - TRUE OPTIMISTIC -----------> */

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
			messagesMapRef.current.delete(messageId);
			triggerMessagesUpdate();

			const rollback = () => {
				messagesMapRef.current.set(messageId, backup);
			};

			const opId = `delete_${messageId}_${Date.now()}`;
			addOptimisticOp({ id: opId, type: 'delete', timestamp: Date.now(), rollback });

			try {
				const res = await services.deleteMessage({
					messageId,
					sessionId,
					callerUid: userUid,
				});

				resolveOptimisticOp(opId, res.ok);

				if (!res.ok) {
					triggerMessagesUpdate();
				}

				return res;
			} catch (err) {
				resolveOptimisticOp(opId, false);
				triggerMessagesUpdate();

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'DELETE_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId, triggerMessagesUpdate, addOptimisticOp, resolveOptimisticOp]
	);


	/* <----------- CLEANUP -----------> */

	const clear = useCallback((): void => {
		cleanupInProgressRef.current = true;

		// Clear data structures
		messagesMapRef.current.clear();
		optimisticOpsRef.current.clear();
		typingUsersMapRef.current.clear();
		messagesCacheRef.current = null;
		typingCacheRef.current = null;

		// Clear state
		if (isMountedRef.current) {
			setMessageVersion(0);
			setInFlightCount(0);
			setTypingVersion(0);
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
			} catch {
				// Silently fail
			}
		}

		// Cleanup RTDB typing listeners
		if (typingRefRef.current) {
			const tRef = typingRefRef.current;
			const listeners = rtdbListenersRef.current;

			try {
				if (listeners.typingAdded) rtdbOff(tRef, 'child_added', listeners.typingAdded);
				if (listeners.typingChanged) rtdbOff(tRef, 'child_changed', listeners.typingChanged);
				if (listeners.typingRemoved) rtdbOff(tRef, 'child_removed', listeners.typingRemoved);
			} catch {
				// Silently fail
			}
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
		sending,
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