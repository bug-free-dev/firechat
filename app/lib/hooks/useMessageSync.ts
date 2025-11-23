/**
 * useMessageSync.ts
 * Handles real-time message synchronization and typing indicators
 * Completely separate from state management for clean separation of concerns
 */

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
import { useCallback, useEffect, useRef, useState } from 'react';

import { clearUserTyping, setUserTyping } from '@/app/lib/api/typingAPI';
import { rtdb } from '@/app/lib/firebase/FireClient';
import type { CachedUser, ChatMessage } from '@/app/lib/types';
import {
	parseMessageFromSnapshot,
	parseTypingUserFromSnapshot,
} from '@/app/lib/utils/message/helpers';
import type { RTDBListeners, SnapshotCallback } from '@/app/lib/utils/message/typeDefs';

/* <----------- CONSTANTS -----------> */

const DEFAULT_TYPING_DEBOUNCE_MS = 1200;
const TYPING_CLEAR_DELAY_MS = 200;

/* <----------- TYPES -----------> */

interface TypingProfile {
	readonly uid: string;
	readonly displayName?: string;
	readonly avatarUrl?: string | null;
}

interface UseMessageSyncParams {
	readonly sessionId: string;
	readonly userUid: string;
	readonly liveLimit: number;
	readonly typingProfile?: TypingProfile;
	readonly typingDebounceMs?: number;
	readonly onMessageUpsert: (msg: ChatMessage) => void;
	readonly onMessageRemove: (msgId: string) => void;
}

export interface UseMessageSyncReturn {
	readonly typingUsers: CachedUser[];
	readonly setTyping: (isTyping: boolean) => void;
	readonly cleanup: () => void;
}

/* <----------- HOOK -----------> */

export function useMessageSync(params: UseMessageSyncParams): UseMessageSyncReturn {
	const {
		sessionId,
		userUid,
		liveLimit,
		typingProfile,
		typingDebounceMs = DEFAULT_TYPING_DEBOUNCE_MS,
		onMessageUpsert,
		onMessageRemove,
	} = params;

	const [_typingVersion, setTypingVersion] = useState(0);

	// Refs
	const typingUsersMapRef = useRef<Map<string, CachedUser>>(new Map());
	const rtdbQueryRef = useRef<RTDBQuery | null>(null);
	const rtdbListenersRef = useRef<RTDBListeners>({});
	const typingRefRef = useRef<ReturnType<typeof rtdbRef> | null>(null);
	const typingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const typingClearTimerRef = useRef<NodeJS.Timeout | null>(null);
	const isTypingActiveRef = useRef(false);
	const isMountedRef = useRef(true);
	const cleanupInProgressRef = useRef(false);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	/* <----------- TYPING UPDATES -----------> */

	const triggerTypingUpdate = useCallback((): void => {
		if (!isMountedRef.current || cleanupInProgressRef.current) return;
		setTypingVersion((v) => v + 1);
	}, []);

	/* <----------- RTDB: LIVE MESSAGES -----------> */

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
					onMessageUpsert(incoming);
				}
			} catch {
				// Silent fail
			}
		};

		const onChange: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const incoming = parseMessageFromSnapshot(snap, sessionId);
				if (incoming?.id) {
					onMessageUpsert(incoming);
				}
			} catch {
				// Silent fail
			}
		};

		const onRem: SnapshotCallback = (snap: DataSnapshot): void => {
			if (cleanupInProgressRef.current) return;

			try {
				const { key } = snap;
				if (key?.trim()) {
					onMessageRemove(key);
				}
			} catch {
				// Silent fail
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
				// Silent fail
			}
		};
	}, [sessionId, liveLimit, onMessageUpsert, onMessageRemove]);

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
				// Silent fail
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
				// Silent fail
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
				// Silent fail
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
				// Silent fail
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
				// Silent fail
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

	/* <----------- CLEANUP -----------> */

	const cleanup = useCallback((): void => {
		cleanupInProgressRef.current = true;

		// Clear data
		typingUsersMapRef.current.clear();
		if (isMountedRef.current) {
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
				// Silent fail
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
				// Silent fail
			}
		}

		// Clear typing indicator on server
		if (sessionId?.trim() && userUid?.trim()) {
			void clearUserTyping({ sessionId, userUid });
		}

		setTimeout(() => {
			cleanupInProgressRef.current = false;
		}, 100);
	}, [sessionId, userUid]);

	/* <----------- COMPUTED VALUES -----------> */

	const typingUsers = Array.from(typingUsersMapRef.current.values()).filter(
		(user) => user.uid !== userUid
	);

	/* <----------- RETURN -----------> */

	return {
		typingUsers,
		setTyping,
		cleanup,
	};
}
