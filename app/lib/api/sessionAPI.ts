'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

import { deductKudos } from '@/app/lib/api/kudosAPI';
import {
	buildInvitedMap,
	readRTDBSession,
	refundKudos,
	verifyIdentifierAccess,
} from '@/app/lib/utils/sessions/helper';

import { adminDb, adminRTDB } from '../firebase/FireAdmin';
import type {
	InboxInviteItem,
	RTDBInvitedUser,
	RTDBParticipant,
	RTDBSessionMetadata,
	ServerResult,
	SessionDoc,
} from '../types';
import { getUserByUid } from '../utils/memory';
import { compare, create } from '../utils/time';

/* <------------- CREATE SESSION -------------> */

export async function createSession(params: {
	creatorUid: string;
	title?: string;
	invited?: string[];
	identifierRequired?: boolean;
	meta?: Record<string, unknown>;
	cost?: number;
}): Promise<ServerResult<SessionDoc>> {
	const {
		creatorUid,
		title = '',
		invited = [],
		identifierRequired = false,
		meta = {},
		cost = 0,
	} = params;

	if (!creatorUid) {
		return { ok: false, error: 'AUTH_REQUIRED' };
	}

	// Deduct kudos if cost specified
	if (cost > 0) {
		const deductRes = await deductKudos(creatorUid, cost, 'create_session');
		if (!deductRes.success) {
			return {
				ok: false,
				error: 'INSUFFICIENT_FUNDS',
				reason: deductRes.reason,
			};
		}
	}

	const sessionId = uuidv4();
	const now = create.nowISO();

	try {
		// Fetch creator profile
		const creatorProfile = await getUserByUid(creatorUid);
		if (!creatorProfile) {
			await refundKudos(creatorUid, cost, 'refund:creator_not_found');
			return { ok: false, error: 'CREATOR_NOT_FOUND' };
		}

		// Build RTDB metadata
		const metadata: RTDBSessionMetadata = {
			id: sessionId,
			title,
			creator: creatorUid,
			isLocked: Boolean(identifierRequired),
			identifierRequired: Boolean(identifierRequired),
			status: 'active',
			createdAt: now,
			updatedAt: now,
		};

		// Creator auto-joins as participant
		const participants: Record<string, RTDBParticipant> = {
			[creatorUid]: {
				joinedAt: now,
				displayName: creatorProfile.displayName,
				avatarUrl: creatorProfile.avatarUrl,
				status: 'active',
			},
		};

		// Build invited map
		const invitedMap = await buildInvitedMap(invited, creatorUid, now);

		// Write to RTDB
		if (!adminRTDB) {
			await refundKudos(creatorUid, cost, 'refund:rtdb_unavailable');
			return { ok: false, error: 'RTDB_UNAVAILABLE' };
		}

		const rtdbPayload = {
			metadata,
			participants,
			...(Object.keys(invitedMap).length > 0 && { invited: invitedMap }),
		};

		await adminRTDB.ref(`liveSessions/${sessionId}`).set(rtdbPayload);

		// Archive to Firestore
		try {
			await adminDb
				.collection('sessions')
				.doc(sessionId)
				.set({
					id: sessionId,
					title,
					creator: creatorUid,
					createdAt: now,
					participants: [creatorUid],
					invited: Object.keys(invitedMap),
					isActive: true,
					identifierRequired: Boolean(identifierRequired),
					archivedAt: FieldValue.serverTimestamp(),
				});
		} catch {
			// Non-critical, continue
		}

		return {
			ok: true,
			data: {
				id: sessionId,
				title,
				creator: creatorUid,
				participants: [creatorUid],
				joinedUsers: [creatorUid],
				isLocked: Boolean(identifierRequired),
				identifierRequired: Boolean(identifierRequired),
				isActive: true,
				createdAt: now,
				meta: {
					invitedUids: Object.keys(invitedMap),
					...meta,
				},
			},
		};
	} catch (err) {
		await refundKudos(creatorUid, cost, 'refund:create_failed');
		return {
			ok: false,
			error: 'CREATE_FAILED',
			reason: (err as Error).message,
		};
	}
}

/* <------------- GET SESSION -------------> */

export async function getSession(
	sessionId: string,
	requesterUid?: string
): Promise<ServerResult<SessionDoc>> {
	if (!sessionId) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	try {
		const session = await readRTDBSession(sessionId);
		if (!session) {
			return { ok: false, error: 'NOT_FOUND' };
		}

		// Authorization check
		if (requesterUid) {
			const isParticipant = session.participants?.includes(requesterUid);
			const isCreator = session.creator === requesterUid;
			const isInvited = session.meta?.invitedUids?.includes(requesterUid);

			if (!isParticipant && !isCreator && !isInvited) {
				return { ok: false, error: 'NOT_AUTHORIZED' };
			}
		}

		return { ok: true, data: session };
	} catch (err) {
		return {
			ok: false,
			error: 'FAILED',
			reason: (err as Error).message,
		};
	}
}

/* <------------- JOIN SESSION -------------> */

export async function joinSession(params: {
	userUid: string;
	sessionId: string;
	identifierInput?: string;
}): Promise<ServerResult<SessionDoc>> {
	const { userUid, sessionId, identifierInput } = params;

	if (!userUid) {
		return { ok: false, error: 'AUTH_REQUIRED' };
	}
	if (!sessionId) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE' };
		}

		const snap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!snap.exists()) {
			return { ok: false, error: 'NOT_FOUND' };
		}

		const val = snap.val() as {
			metadata?: RTDBSessionMetadata;
			invited?: Record<string, RTDBInvitedUser>;
			participants?: Record<string, RTDBParticipant>;
		};

		const meta = val.metadata;
		if (!meta) {
			return { ok: false, error: 'NOT_FOUND' };
		}
		if (meta.status !== 'active') {
			return { ok: false, error: 'SESSION_INACTIVE' };
		}

		// Check if already participant
		if (val.participants?.[userUid]) {
			const session = await readRTDBSession(sessionId);
			return { ok: true, data: session! };
		}

		// Verify identifier if required
		if (meta.identifierRequired) {
			const verifyResult = await verifyIdentifierAccess(userUid, identifierInput);
			if (!verifyResult.ok) {
				return verifyResult as ServerResult<SessionDoc>;
			}
		}

		// Fetch user profile
		const profile = await getUserByUid(userUid);
		if (!profile) {
			return { ok: false, error: 'USER_NOT_FOUND' };
		}

		const now = create.nowISO();

		// Atomic transaction: move from invited → participants
		const updates: Record<string, unknown> = {
			[`participants/${userUid}`]: {
				joinedAt: now,
				displayName: profile.displayName,
				avatarUrl: profile.avatarUrl,
				status: 'active',
			},
			'metadata/updatedAt': now,
		};

		// Remove from invited if exists
		if (val.invited?.[userUid]) {
			updates[`invited/${userUid}`] = null;
		}

		await adminRTDB.ref(`liveSessions/${sessionId}`).update(updates);

		const updatedSession = await readRTDBSession(sessionId);
		if (!updatedSession) {
			return { ok: false, error: 'FAILED' };
		}

		return { ok: true, data: updatedSession };
	} catch (err) {
		return {
			ok: false,
			error: 'FAILED',
			reason: (err as Error).message,
		};
	}
}

/* <------------- LEAVE SESSION -------------> */

export async function leaveSession(
	userUid: string,
	sessionId: string
): Promise<ServerResult<null>> {
	if (!userUid) {
		return { ok: false, error: 'AUTH_REQUIRED' };
	}
	if (!sessionId) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE' };
		}

		const snap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!snap.exists()) {
			return { ok: false, error: 'NOT_FOUND' };
		}

		const val = snap.val() as { metadata?: RTDBSessionMetadata };
		const creator = val.metadata?.creator;

		if (creator === userUid) {
			return {
				ok: false,
				error: 'CREATOR_CANNOT_LEAVE',
				reason: 'Use endSession instead',
			};
		}

		await adminRTDB.ref(`liveSessions/${sessionId}/participants/${userUid}`).remove();
		await adminRTDB.ref(`liveSessions/${sessionId}/metadata/updatedAt`).set(create.nowISO());

		return { ok: true, data: null };
	} catch (err) {
		return {
			ok: false,
			error: 'FAILED',
			reason: (err as Error).message,
		};
	}
}

/* -------------> END SESSION -------------> */

export async function endSession(
	callerUid: string,
	sessionId: string
): Promise<ServerResult<null>> {
	if (!callerUid) {
		return { ok: false, error: 'AUTH_REQUIRED' };
	}
	if (!sessionId) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE' };
		}

		const snap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!snap.exists()) {
			return { ok: false, error: 'NOT_FOUND' };
		}

		const val = snap.val() as { metadata?: RTDBSessionMetadata };
		const creator = val.metadata?.creator;

		if (creator !== callerUid) {
			return { ok: false, error: 'NOT_ALLOWED' };
		}

		const now = create.nowISO();

		await adminRTDB.ref(`liveSessions/${sessionId}/metadata`).update({
			status: 'ended',
			updatedAt: now,
		});

		// Archive to Firestore
		try {
			await adminDb.collection('sessionsHistory').doc(sessionId).update({
				isActive: false,
				endedAt: now,
			});
		} catch {
			// Non-critical
		}

		try {
			await adminRTDB?.ref(`liveSessions/${sessionId}`).remove();
		} catch {
			// Silent failure
		}

		return { ok: true, data: null };
	} catch (err) {
		return {
			ok: false,
			error: 'FAILED',
			reason: (err as Error).message,
		};
	}
}

/* -------------> TOGGLE LOCK -------------> */

export async function toggleLockSession(
	callerUid: string,
	sessionId: string,
	locked: boolean
): Promise<ServerResult<null>> {
	if (!callerUid) {
		return { ok: false, error: 'AUTH_REQUIRED' };
	}
	if (!sessionId) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE' };
		}

		const snap = await adminRTDB.ref(`liveSessions/${sessionId}/metadata`).get();
		if (!snap.exists()) {
			return { ok: false, error: 'NOT_FOUND' };
		}

		const meta = snap.val() as RTDBSessionMetadata;
		if (meta.creator !== callerUid) {
			return { ok: false, error: 'NOT_ALLOWED' };
		}

		await adminRTDB.ref(`liveSessions/${sessionId}/metadata`).update({
			isLocked: Boolean(locked),
			updatedAt: create.nowISO(),
		});

		return { ok: true, data: null };
	} catch (err) {
		return {
			ok: false,
			error: 'FAILED',
			reason: (err as Error).message,
		};
	}
}

/* <------------- UPDATE METADATA -------------> */

export async function updateSessionMetadata(params: {
	callerUid: string;
	sessionId: string;
	updates: {
		title?: string;
		identifierRequired?: boolean;
		meta?: Record<string, unknown>;
	};
}): Promise<ServerResult<SessionDoc>> {
	const { callerUid, sessionId, updates } = params;

	if (!callerUid) {
		return { ok: false, error: 'AUTH_REQUIRED' };
	}
	if (!sessionId) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE' };
		}

		const snap = await adminRTDB.ref(`liveSessions/${sessionId}/metadata`).get();
		if (!snap.exists()) {
			return { ok: false, error: 'NOT_FOUND' };
		}

		const meta = snap.val() as RTDBSessionMetadata;
		if (meta.creator !== callerUid) {
			return { ok: false, error: 'NOT_ALLOWED' };
		}

		const rtdbUpdates: Partial<RTDBSessionMetadata> = {
			updatedAt: create.nowISO(),
		};

		if (typeof updates.title === 'string') {
			rtdbUpdates.title = updates.title;
		}
		if (typeof updates.identifierRequired === 'boolean') {
			rtdbUpdates.identifierRequired = updates.identifierRequired;
			rtdbUpdates.isLocked = updates.identifierRequired;
		}

		await adminRTDB.ref(`liveSessions/${sessionId}/metadata`).update(rtdbUpdates);

		const updatedSession = await readRTDBSession(sessionId);
		if (!updatedSession) {
			return { ok: false, error: 'FAILED' };
		}

		return { ok: true, data: updatedSession };
	} catch (err) {
		return {
			ok: false,
			error: 'FAILED',
			reason: (err as Error).message,
		};
	}
}

/* <------------- ADD PARTICIPANT (INVITE) -------------> */

export async function addParticipant(
	sessionId: string,
	userIdToAdd: string
): Promise<ServerResult<SessionDoc>> {
	if (!sessionId) {
		return { ok: false, error: 'INVALID_INPUT' };
	}
	if (!userIdToAdd) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE' };
		}

		const snap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!snap.exists()) {
			return { ok: false, error: 'NOT_FOUND' };
		}

		const val = snap.val() as {
			metadata?: RTDBSessionMetadata;
			invited?: Record<string, RTDBInvitedUser>;
			participants?: Record<string, RTDBParticipant>;
		};

		const meta = val.metadata;
		if (!meta) {
			return { ok: false, error: 'NOT_FOUND' };
		}
		if (meta.status !== 'active') {
			return { ok: false, error: 'SESSION_INACTIVE' };
		}

		// Check if already participant or invited
		if (val.participants?.[userIdToAdd]) {
			return { ok: false, error: 'ALREADY_PARTICIPANT' };
		}
		if (val.invited?.[userIdToAdd]) {
			return { ok: false, error: 'ALREADY_INVITED' };
		}

		const profile = await getUserByUid(userIdToAdd);
		if (!profile) {
			return { ok: false, error: 'USER_NOT_FOUND' };
		}

		const now = create.nowISO();

		await adminRTDB.ref(`liveSessions/${sessionId}/invited/${userIdToAdd}`).set({
			invitedAt: now,
			displayName: profile.displayName,
			avatarUrl: profile.avatarUrl,
		});

		await adminRTDB.ref(`liveSessions/${sessionId}/metadata/updatedAt`).set(now);

		const updatedSession = await readRTDBSession(sessionId);
		if (!updatedSession) {
			return { ok: false, error: 'FAILED' };
		}

		return { ok: true, data: updatedSession };
	} catch (err) {
		return {
			ok: false,
			error: 'FAILED',
			reason: (err as Error).message,
		};
	}
}

export async function inviteUsersToSession(params: {
	sessionId: string;
	toUids: string[];
	fromUid: string;
	sessionTitle?: string;
	customMessage?: string;
}): Promise<ServerResult<{ invitedCount: number; skippedCount: number }>> {
	const { sessionId, toUids, fromUid, sessionTitle, customMessage } = params;

	// Input validation
	if (!adminRTDB) {
		return { ok: false, error: 'RTDB_UNAVAILABLE' };
	}
	if (!sessionId?.trim() || !fromUid?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'sessionId and fromUid required' };
	}
	if (!Array.isArray(toUids) || toUids.length === 0) {
		return { ok: false, error: 'NO_RECIPIENTS' };
	}
	if (toUids.length > 100) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'Max 100 invites per request' };
	}

	try {
		// Phase 1: Read and validate session state (single read)
		const sessionSnap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!sessionSnap.exists()) {
			return { ok: false, error: 'SESSION_NOT_FOUND' };
		}

		const sessionData = sessionSnap.val() as {
			metadata?: RTDBSessionMetadata;
			participants?: Record<string, RTDBParticipant>;
			invited?: Record<string, RTDBInvitedUser>;
		};

		const metadata = sessionData.metadata;
		if (!metadata) {
			return { ok: false, error: 'SESSION_NOT_FOUND' };
		}
		if (metadata.status !== 'active') {
			return { ok: false, error: 'SESSION_INACTIVE' };
		}

		// Phase 2: Deduplicate and validate users
		const existingParticipants = new Set(Object.keys(sessionData.participants ?? {}));
		const existingInvited = new Set(Object.keys(sessionData.invited ?? {}));
		const validUsers: string[] = [];
		const skipped: string[] = [];

		// Deduplicate input
		const uniqueToUids = Array.from(new Set(toUids.filter(Boolean)));

		for (const uid of uniqueToUids) {
			// Skip self-invite
			if (uid === fromUid) {
				skipped.push(uid);
				continue;
			}

			// Skip already participant
			if (existingParticipants.has(uid)) {
				skipped.push(uid);
				continue;
			}

			// Skip already invited
			if (existingInvited.has(uid)) {
				skipped.push(uid);
				continue;
			}

			validUsers.push(uid);
		}

		if (validUsers.length === 0) {
			const message =
				skipped.length === 1
					? `User is already invited or a participant.`
					: `All ${skipped.length} users are already invited or are participants.`;

			return {
				ok: false,
				error: 'NO_VALID_USERS',
				reason: message,
			};
		}

		// Phase 3: Fetch profiles for valid users (parallel)
		const profileMap = new Map<string, { displayName: string; avatarUrl?: string | null }>();
		await Promise.all(
			validUsers.map(async (uid) => {
				try {
					const profile = await getUserByUid(uid);
					if (profile) {
						profileMap.set(uid, {
							displayName: profile.displayName,
							avatarUrl: profile.avatarUrl,
						});
					} else {
						skipped.push(uid);
					}
				} catch {
					skipped.push(uid);
				}
			})
		);

		// Final filter: only users with valid profiles
		const usersToInvite = validUsers.filter((uid) => profileMap.has(uid));

		if (usersToInvite.length === 0) {
			return {
				ok: false,
				error: 'NO_VALID_USERS',
				reason: 'No user profiles found',
			};
		}

		// Phase 4: Build atomic transaction payload
		const now = create.nowISO();
		const updates: Record<string, unknown> = {};

		// Add invited/ nodes
		for (const uid of usersToInvite) {
			const profile = profileMap.get(uid)!;
			updates[`liveSessions/${sessionId}/invited/${uid}`] = {
				invitedAt: now,
				displayName: profile.displayName,
				avatarUrl: profile.avatarUrl,
			};
		}

		// Add inbox notifications
		for (const uid of usersToInvite) {
			const threadKey = `invite_session_${sessionId}`;
			const item: InboxInviteItem = {
				type: 'invite',
				from: fromUid,
				sessionId,
				message: customMessage || `Join "${sessionTitle || ''}" 🔥`,
				createdAt: now,
				read: false,
			};
			updates[`inbox/${uid}/${threadKey}`] = item;
		}

		// Update session metadata
		updates[`liveSessions/${sessionId}/metadata/updatedAt`] = now;

		// Phase 5: Atomic write (single transaction)
		await adminRTDB.ref().update(updates);

		return {
			ok: true,
			data: {
				invitedCount: usersToInvite.length,
				skippedCount: skipped.length,
			},
		};
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return {
			ok: false,
			error: 'TRANSACTION_FAILED',
			reason: errorMessage,
		};
	}
}

/**
 * Fetches all sessions and invites for a user in a single RTDB read.
 * Returns separated arrays for clean UI rendering.
 *
 * @param userUid - User ID to fetch sessions for
 * @param includeInactive - Whether to include ended sessions
 * @returns Object with sessions (participant/creator) and invitedSessions (pending invites)
 */
export async function getUserSessionsAndInvites(
	userUid: string,
	includeInactive = false
): Promise<
	ServerResult<{
		sessions: SessionDoc[];
		invitedSessions: SessionDoc[];
	}>
> {
	// Input validation
	if (!userUid?.trim()) {
		return { ok: false, error: 'AUTH_REQUIRED' };
	}

	if (!adminRTDB) {
		return { ok: false, error: 'RTDB_UNAVAILABLE' };
	}

	try {
		// Single RTDB read - O(1) operation
		const snap = await adminRTDB.ref('liveSessions').get();

		if (!snap.exists()) {
			return {
				ok: true,
				data: { sessions: [], invitedSessions: [] },
			};
		}

		const allSessions = snap.val() as Record<
			string,
			{
				metadata?: RTDBSessionMetadata;
				invited?: Record<string, RTDBInvitedUser>;
				participants?: Record<string, RTDBParticipant>;
			}
		>;

		const sessions: SessionDoc[] = [];
		const invitedSessions: SessionDoc[] = [];

		// Single pass through all sessions - O(n)
		for (const [sessionId, val] of Object.entries(allSessions)) {
			const meta = val.metadata;

			// Skip invalid sessions
			if (!meta?.id) continue;

			// Skip inactive if not requested
			if (!includeInactive && meta.status !== 'active') continue;

			// Determine user's relationship to session
			const isParticipant = val.participants?.[userUid] !== undefined;
			const isInvited = val.invited?.[userUid] !== undefined;
			const isCreator = meta.creator === userUid;

			// Skip if user has no relationship to session
			if (!isParticipant && !isInvited && !isCreator) continue;

			// Build session document
			const participantUids = Object.keys(val.participants ?? {});
			const invitedUids = Object.keys(val.invited ?? {});

			const sessionDoc: SessionDoc = {
				id: sessionId,
				title: meta.title || '',
				creator: meta.creator,
				participants: participantUids,
				joinedUsers: participantUids,
				isLocked: meta.isLocked,
				identifierRequired: meta.identifierRequired,
				isActive: meta.status === 'active',
				createdAt: meta.createdAt,
				meta: { invitedUids },
			};

			if (isParticipant || isCreator) {
				sessions.push(sessionDoc);
			} else if (isInvited && !isParticipant) {
				invitedSessions.push(sessionDoc);
			}
		}

		sessions.sort((a, b) => compare.desc(a.createdAt, b.createdAt));
		invitedSessions.sort((a, b) => compare.desc(a.createdAt, b.createdAt));

		return {
			ok: true,
			data: { sessions, invitedSessions },
		};
	} catch (err) {
		return {
			ok: false,
			error: 'FETCH_FAILED',
			reason: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}
