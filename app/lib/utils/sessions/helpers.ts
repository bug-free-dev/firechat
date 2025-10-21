/* <------------------- SESSION HELPERS -------------------> */

import { grantKudos } from '@/app/lib/api/kudosAPI';
import { adminDb, adminRTDB } from '@/app/lib/firebase/FireAdmin';
import {
	RTDBInvitedUser,
	RTDBParticipant,
	RTDBSessionMetadata,
	ServerResult,
	SessionDoc,
} from '@/app/lib/types';
import { verifyIdentifierKeyAsync } from '@/app/lib/utils/hashy';

import { getUserByUid } from '../memory';

/**
 * Reads session from RTDB and transforms to SessionDoc format.
 */
export async function readRTDBSession(sessionId: string): Promise<SessionDoc | null> {
	if (!adminRTDB) return null;

	try {
		const snap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!snap.exists()) return null;

		const val = snap.val() as {
			metadata?: RTDBSessionMetadata;
			invited?: Record<string, RTDBInvitedUser>;
			participants?: Record<string, RTDBParticipant>;
		};

		const meta = val.metadata;
		if (!meta) return null;

		const invitedUids = Object.keys(val.invited ?? {});
		const participantUids = Object.keys(val.participants ?? {});

		return {
			id: meta.id,
			title: meta.title,
			creator: meta.creator,
			participants: participantUids,
			joinedUsers: participantUids,
			isLocked: meta.isLocked,
			identifierRequired: meta.identifierRequired,
			isActive: meta.status === 'active',
			createdAt: meta.createdAt,
			meta: { invitedUids },
		};
	} catch {
		return null;
	}
}

/**
 * Verifies user access via identifier key.
 */
export async function verifyIdentifierAccess(
	userUid: string,
	identifierInput?: string
): Promise<ServerResult<void>> {
	if (!identifierInput) {
		return { ok: false, error: 'IDENTIFIER_REQUIRED' };
	}

	const userSnap = await adminDb.collection('users').doc(userUid).get();
	if (!userSnap.exists) {
		return { ok: false, error: 'USER_NOT_FOUND' };
	}

	const storedHash = String(userSnap.data()?.identifierKey ?? '');
	if (!storedHash) {
		return { ok: false, error: 'IDENTIFIER_NOT_SET' };
	}

	const valid = await verifyIdentifierKeyAsync(identifierInput, storedHash);
	if (!valid) {
		return { ok: false, error: 'IDENTIFIER_INVALID' };
	}

	return { ok: true, data: undefined };
}

/**
 * Builds invited user map with profile data.
 */
export async function buildInvitedMap(
	invited: string[],
	creatorUid: string,
	now: string
): Promise<Record<string, RTDBInvitedUser>> {
	const invitedMap: Record<string, RTDBInvitedUser> = {};
	const uniqueInvited = Array.from(new Set(invited.filter(Boolean)));

	for (const uid of uniqueInvited) {
		if (uid === creatorUid) continue;

		const profile = await getUserByUid(uid);
		if (profile) {
			invitedMap[uid] = {
				invitedAt: now,
				displayName: profile.displayName,
				avatarUrl: profile.avatarUrl,
			};
		}
	}

	return invitedMap;
}

/**
 * Refunds kudos on operation failure.
 */
export async function refundKudos(userUid: string, amount: number, reason: string): Promise<void> {
	if (amount <= 0) return;

	try {
		await grantKudos(userUid, amount, reason);
	} catch {}
}
