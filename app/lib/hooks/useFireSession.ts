'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	type DataSnapshot,
	off as rtdbOff,
	onValue,
	type Query as RTDBQuery,
	ref as rtdbRef,
} from 'firebase/database';

import { rtdb } from '@/app/lib/firebase/FireClient';
import type { ServerResult, SessionDoc } from '@/app/lib/types';
import { compare } from '@/app/lib/utils/time';

/* ==================== CONSTANTS ==================== */

const POLL_INTERVAL_MS = 5000;
const CACHE_INVALIDATION_MS = 10000;
const MAX_SESSIONS_IN_MEMORY = 100;

/* ==================== TYPES ==================== */

export interface SessionServices {
	getUserSessionsAndInvites: (
		userUid: string,
		includeInactive?: boolean
	) => Promise<
		ServerResult<{
			sessions: SessionDoc[];
			invitedSessions: SessionDoc[];
		}>
	>;

	createSession: (params: {
		creatorUid: string;
		title?: string;
		invited?: string[];
		identifierRequired?: boolean;
		meta?: Record<string, unknown>;
		cost?: number;
	}) => Promise<ServerResult<SessionDoc>>;

	joinSession: (params: {
		userUid: string;
		sessionId: string;
		identifierInput?: string;
	}) => Promise<ServerResult<SessionDoc>>;

	leaveSession: (userUid: string, sessionId: string) => Promise<ServerResult<null>>;
	endSession: (callerUid: string, sessionId: string) => Promise<ServerResult<null>>;
	toggleLockSession: (
		callerUid: string,
		sessionId: string,
		locked: boolean
	) => Promise<ServerResult<null>>;

	updateSessionMetadata: (params: {
		callerUid: string;
		sessionId: string;
		updates: {
			title?: string;
			identifierRequired?: boolean;
			meta?: Record<string, unknown>;
		};
	}) => Promise<ServerResult<SessionDoc>>;
}

export interface UseFireSessionOptions {
	userUid: string | null;
	services: SessionServices;
	enableRealtime?: boolean;
	pollingInterval?: number;
	autoRefresh?: boolean;
}

export interface UseFireSessionReturn {
	sessions: SessionDoc[];
	invitedSessions: SessionDoc[];
	loading: boolean;
	error: string | null;
	lastSyncedAt: number | null;

	createSession: (params: {
		title?: string;
		invited?: string[];
		identifierRequired?: boolean;
		meta?: Record<string, unknown>;
		cost?: number;
	}) => Promise<ServerResult<SessionDoc>>;

	joinSession: (params: {
		sessionId: string;
		identifierInput?: string;
	}) => Promise<ServerResult<SessionDoc>>;

	leaveSession: (sessionId: string) => Promise<ServerResult<null>>;
	endSession: (sessionId: string) => Promise<ServerResult<null>>;
	toggleLock: (sessionId: string, locked: boolean) => Promise<ServerResult<null>>;

	updateSessionMetadata: (params: {
		sessionId: string;
		updates: {
			title?: string;
			identifierRequired?: boolean;
			meta?: Record<string, unknown>;
		};
	}) => Promise<ServerResult<SessionDoc>>;

	refresh: () => Promise<void>;
	clear: () => void;
}

/* ==================== HOOK ==================== */

export function useFireSession(options: UseFireSessionOptions): UseFireSessionReturn {
	const {
		userUid,
		services,
		enableRealtime = true,
		pollingInterval = POLL_INTERVAL_MS,
		autoRefresh = true,
	} = options;

	if (!services?.getUserSessionsAndInvites) {
		throw new Error('[useFireSession] services.getUserSessionsAndInvites is required');
	}

	// State
	const [sessions, setSessions] = useState<SessionDoc[]>([]);
	const [invitedSessions, setInvitedSessions] = useState<SessionDoc[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

	// Refs for atomic operations
	const sessionsMapRef = useRef<Map<string, SessionDoc>>(new Map());
	const invitedMapRef = useRef<Map<string, SessionDoc>>(new Map());
	const isMountedRef = useRef<boolean>(true);
	const lastFetchTimeRef = useRef<number>(0);
	const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
	const rtdbListenerRef = useRef<{ ref: RTDBQuery; cleanup: () => void } | null>(null);
	const pendingOperationsRef = useRef<Set<string>>(new Set());
	const fetchInProgressRef = useRef<boolean>(false);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	/* ==================== COMPUTED VALUES ==================== */

	const sortedSessions = useMemo<SessionDoc[]>(() => {
		const arr = Array.from(sessionsMapRef.current.values());

		// Memory limit protection
		if (arr.length > MAX_SESSIONS_IN_MEMORY) {
			arr.sort((a, b) => compare.desc(a.createdAt, b.createdAt));
			const keep = arr.slice(0, MAX_SESSIONS_IN_MEMORY);
			sessionsMapRef.current = new Map(keep.map((s) => [s.id!, s]));
			return keep;
		}

		arr.sort((a, b) => compare.desc(a.createdAt, b.createdAt));
		return arr;
	}, [sessions]);

	const sortedInvitedSessions = useMemo<SessionDoc[]>(() => {
		const arr = Array.from(invitedMapRef.current.values());
		arr.sort((a, b) => compare.desc(a.createdAt, b.createdAt));
		return arr;
	}, [invitedSessions]);

	/* ==================== STATE SYNC ==================== */

	const triggerSync = useCallback((): void => {
		if (isMountedRef.current) {
			setSessions(Array.from(sessionsMapRef.current.values()));
			setInvitedSessions(Array.from(invitedMapRef.current.values()));
		}
	}, []);

	/* ==================== FETCH SESSIONS (Race Condition Protected) ==================== */

	const fetchSessions = useCallback(
		async (force = false): Promise<void> => {
			if (!userUid?.trim()) return;

			// ✅ Prevent concurrent fetches
			if (fetchInProgressRef.current && !force) {
				return;
			}

			const now = Date.now();
			const timeSinceLastFetch = now - lastFetchTimeRef.current;

			// Cache check
			if (!force && timeSinceLastFetch < CACHE_INVALIDATION_MS) {
				return;
			}

			fetchInProgressRef.current = true;
			lastFetchTimeRef.current = now;

			setLoading(true);
			setError(null);

			try {
				// ✅ Single API call for both sessions and invites
				const res = await services.getUserSessionsAndInvites(userUid, false);

				if (!res.ok) {
					setError(res.error);
					return;
				}

				// ✅ Atomic update - clear and rebuild maps
				sessionsMapRef.current.clear();
				invitedMapRef.current.clear();

				// Populate sessions map
				for (const session of res.data.sessions) {
					if (session?.id?.trim()) {
						sessionsMapRef.current.set(session.id, session);
					}
				}

				// Populate invited map
				for (const session of res.data.invitedSessions) {
					if (session?.id?.trim()) {
						invitedMapRef.current.set(session.id, session);
					}
				}

				triggerSync();
				setLastSyncedAt(now);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				setError(errorMessage);
			} finally {
				if (isMountedRef.current) {
					setLoading(false);
				}
				fetchInProgressRef.current = false;
			}
		},
		[userUid, services, triggerSync]
	);

	/* ==================== REALTIME LISTENER ==================== */

	const setupRealtimeListener = useCallback(() => {
		if (!enableRealtime || !userUid?.trim() || !rtdb) return;

		if (rtdbListenerRef.current) {
			rtdbListenerRef.current.cleanup();
			rtdbListenerRef.current = null;
		}

		try {
			const metadataRef = rtdbRef(rtdb, `sessionMetadata/${userUid}`);

			const handleMetadataChange = (snap: DataSnapshot): void => {
				if (!isMountedRef.current) return;

				const lastUpdate = snap.val() as number | null;
				if (lastUpdate && lastUpdate > lastFetchTimeRef.current) {
					void fetchSessions(true);
				}
			};

			onValue(metadataRef, handleMetadataChange);

			rtdbListenerRef.current = {
				ref: metadataRef,
				cleanup: () => rtdbOff(metadataRef, 'value', handleMetadataChange),
			};
		} catch {}
	}, [enableRealtime, userUid, fetchSessions]);

	/* ==================== POLLING FALLBACK ==================== */

	const setupPolling = useCallback(() => {
		if (!autoRefresh || !userUid?.trim()) return;

		if (pollingTimerRef.current) {
			clearInterval(pollingTimerRef.current);
		}

		pollingTimerRef.current = setInterval(() => {
			if (isMountedRef.current && !loading && !fetchInProgressRef.current) {
				void fetchSessions(false);
			}
		}, pollingInterval);
	}, [autoRefresh, userUid, loading, pollingInterval, fetchSessions]);

	/* ==================== INITIAL LOAD ==================== */

	useEffect(() => {
		void fetchSessions(true);
	}, [fetchSessions]);

	/* ==================== REALTIME & POLLING SETUP ==================== */

	useEffect(() => {
		setupRealtimeListener();
		setupPolling();

		return () => {
			if (rtdbListenerRef.current) {
				rtdbListenerRef.current.cleanup();
				rtdbListenerRef.current = null;
			}

			if (pollingTimerRef.current) {
				clearInterval(pollingTimerRef.current);
				pollingTimerRef.current = null;
			}
		};
	}, [setupRealtimeListener, setupPolling]);

	/* ==================== ACTIONS ==================== */

	const createSession = useCallback(
		async (params: {
			title?: string;
			invited?: string[];
			identifierRequired?: boolean;
			meta?: Record<string, unknown>;
			cost?: number;
		}): Promise<ServerResult<SessionDoc>> => {
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'User not authenticated' };
			}

			const operationId = `create-${Date.now()}`;
			pendingOperationsRef.current.add(operationId);

			try {
				const res = await services.createSession({
					creatorUid: userUid,
					...params,
				});

				if (res.ok && res.data?.id?.trim()) {
					// ✅ Add to sessions (creator auto-joins)
					sessionsMapRef.current.set(res.data.id, res.data);
					triggerSync();
				}

				return res;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'CREATE_FAILED', reason: errorMessage };
			} finally {
				pendingOperationsRef.current.delete(operationId);
			}
		},
		[userUid, services, triggerSync]
	);

	const joinSession = useCallback(
		async (params: {
			sessionId: string;
			identifierInput?: string;
		}): Promise<ServerResult<SessionDoc>> => {
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'User not authenticated' };
			}
			if (!params.sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'Session ID required' };
			}

			const { sessionId } = params;
			const operationId = `join-${sessionId}`;
			pendingOperationsRef.current.add(operationId);

			const prevInvited = invitedMapRef.current.get(sessionId);
			const prevSession = sessionsMapRef.current.get(sessionId);

			if (prevInvited) {
				const optimisticSession: SessionDoc = {
					...prevInvited,
					participants: [...(prevInvited.participants || []), userUid],
					joinedUsers: [...(prevInvited.joinedUsers || []), userUid],
				};

				invitedMapRef.current.delete(sessionId);
				sessionsMapRef.current.set(sessionId, optimisticSession);
				triggerSync();
			}

			try {
				const res = await services.joinSession({ userUid, ...params });

				if (res.ok && res.data?.id?.trim()) {
					sessionsMapRef.current.set(res.data.id, res.data);
					invitedMapRef.current.delete(sessionId);
					triggerSync();
				} else {
					if (prevInvited) {
						invitedMapRef.current.set(sessionId, prevInvited);
					}
					if (prevSession) {
						sessionsMapRef.current.set(sessionId, prevSession);
					} else {
						sessionsMapRef.current.delete(sessionId);
					}
					triggerSync();
				}

				return res;
			} catch (err) {
				if (prevInvited) {
					invitedMapRef.current.set(sessionId, prevInvited);
				}
				if (prevSession) {
					sessionsMapRef.current.set(sessionId, prevSession);
				} else {
					sessionsMapRef.current.delete(sessionId);
				}
				triggerSync();

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'JOIN_FAILED', reason: errorMessage };
			} finally {
				pendingOperationsRef.current.delete(operationId);
			}
		},
		[userUid, services, triggerSync]
	);

	const leaveSession = useCallback(
		async (sessionId: string): Promise<ServerResult<null>> => {
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'User not authenticated' };
			}
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'Session ID required' };
			}

			const operationId = `leave-${sessionId}`;
			pendingOperationsRef.current.add(operationId);

			const prevSession = sessionsMapRef.current.get(sessionId);

			// ✅ Optimistic update: update participants array
			if (prevSession) {
				const optimistic: SessionDoc = {
					...prevSession,
					participants: (prevSession.participants ?? []).filter((p) => p !== userUid),
					joinedUsers: (prevSession.joinedUsers ?? []).filter((p) => p !== userUid),
				};
				sessionsMapRef.current.set(sessionId, optimistic);
				triggerSync();
			}

			try {
				const res = await services.leaveSession(userUid, sessionId);

				if (res.ok) {
					// ✅ Server confirmed - remove from sessions
					sessionsMapRef.current.delete(sessionId);
					triggerSync();
				} else if (prevSession) {
					// ✅ Rollback
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				return res;
			} catch (err) {
				// ✅ Rollback on error
				if (prevSession) {
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'LEAVE_FAILED', reason: errorMessage };
			} finally {
				pendingOperationsRef.current.delete(operationId);
			}
		},
		[userUid, services, triggerSync]
	);

	const endSession = useCallback(
		async (sessionId: string): Promise<ServerResult<null>> => {
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'User not authenticated' };
			}
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'Session ID required' };
			}

			const operationId = `end-${sessionId}`;
			pendingOperationsRef.current.add(operationId);

			const prevSession = sessionsMapRef.current.get(sessionId);

			// ✅ Optimistic update
			if (prevSession) {
				const optimistic: SessionDoc = {
					...prevSession,
					isActive: false,
				};
				sessionsMapRef.current.set(sessionId, optimistic);
				triggerSync();
			}

			try {
				const res = await services.endSession(userUid, sessionId);

				if (!res.ok && prevSession) {
					// ✅ Rollback
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				return res;
			} catch (err) {
				// ✅ Rollback on error
				if (prevSession) {
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'END_FAILED', reason: errorMessage };
			} finally {
				pendingOperationsRef.current.delete(operationId);
			}
		},
		[userUid, services, triggerSync]
	);

	const toggleLock = useCallback(
		async (sessionId: string, locked: boolean): Promise<ServerResult<null>> => {
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'User not authenticated' };
			}
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'Session ID required' };
			}

			const operationId = `toggleLock-${sessionId}`;
			pendingOperationsRef.current.add(operationId);

			const prevSession = sessionsMapRef.current.get(sessionId);

			// ✅ Optimistic update
			if (prevSession) {
				const optimistic: SessionDoc = {
					...prevSession,
					isLocked: locked,
				};
				sessionsMapRef.current.set(sessionId, optimistic);
				triggerSync();
			}

			try {
				const res = await services.toggleLockSession(userUid, sessionId, locked);

				if (!res.ok && prevSession) {
					// ✅ Rollback
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				return res;
			} catch (err) {
				// ✅ Rollback on error
				if (prevSession) {
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'TOGGLE_LOCK_FAILED', reason: errorMessage };
			} finally {
				pendingOperationsRef.current.delete(operationId);
			}
		},
		[userUid, services, triggerSync]
	);

	const updateSessionMetadata = useCallback(
		async (params: {
			sessionId: string;
			updates: {
				title?: string;
				identifierRequired?: boolean;
				meta?: Record<string, unknown>;
			};
		}): Promise<ServerResult<SessionDoc>> => {
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'User not authenticated' };
			}
			if (!params.sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'Session ID required' };
			}

			const { sessionId, updates } = params;
			const operationId = `update-${sessionId}`;
			pendingOperationsRef.current.add(operationId);

			const prevSession = sessionsMapRef.current.get(sessionId);

			// ✅ Optimistic update
			if (prevSession) {
				const optimistic: SessionDoc = {
					...prevSession,
					...(updates.title !== undefined && { title: updates.title }),
					...(updates.identifierRequired !== undefined && {
						identifierRequired: updates.identifierRequired,
						isLocked: updates.identifierRequired,
					}),
				};
				sessionsMapRef.current.set(sessionId, optimistic);
				triggerSync();
			}

			try {
				const res = await services.updateSessionMetadata({
					callerUid: userUid,
					sessionId,
					updates,
				});

				if (res.ok && res.data?.id?.trim()) {
					sessionsMapRef.current.set(res.data.id, res.data);
					triggerSync();
				} else if (!res.ok && prevSession) {
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				return res;
			} catch (err) {
				// ✅ Rollback on error
				if (prevSession) {
					sessionsMapRef.current.set(sessionId, prevSession);
					triggerSync();
				}

				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'UPDATE_FAILED', reason: errorMessage };
			} finally {
				pendingOperationsRef.current.delete(operationId);
			}
		},
		[userUid, services, triggerSync]
	);

	const refresh = useCallback(async (): Promise<void> => {
		await fetchSessions(true);
	}, [fetchSessions]);

	const clear = useCallback((): void => {
		sessionsMapRef.current.clear();
		invitedMapRef.current.clear();
		pendingOperationsRef.current.clear();
		lastFetchTimeRef.current = 0;
		fetchInProgressRef.current = false;

		if (pollingTimerRef.current) {
			clearInterval(pollingTimerRef.current);
			pollingTimerRef.current = null;
		}

		if (rtdbListenerRef.current) {
			rtdbListenerRef.current.cleanup();
			rtdbListenerRef.current = null;
		}

		if (isMountedRef.current) {
			setSessions([]);
			setInvitedSessions([]);
			setError(null);
			setLoading(false);
			setLastSyncedAt(null);
		}
	}, []);

	/* ==================== CLEANUP ==================== */

	useEffect(() => {
		return () => {
			clear();
		};
	}, [clear]);

	/* ==================== RETURN ==================== */

	return {
		sessions: sortedSessions,
		invitedSessions: sortedInvitedSessions,
		loading,
		error,
		lastSyncedAt,
		createSession,
		joinSession,
		leaveSession,
		endSession,
		toggleLock,
		updateSessionMetadata,
		refresh,
		clear,
	};
}
