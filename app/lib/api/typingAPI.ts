'use server';

import { adminRTDB } from '@/app/lib/firebase/FireAdmin';
import type { ServerResult } from '@/app/lib/types';

interface TypingPayload {
	displayName: string;
	avatarUrl: string | null;
	startedAt: string;
}

export async function setUserTyping(params: {
	sessionId: string;
	userUid: string;
	displayName: string;
	avatarUrl?: string | null;
	isTyping: boolean;
}): Promise<ServerResult<null>> {
	const { sessionId, userUid, displayName, avatarUrl, isTyping } = params;

	if (!sessionId || !userUid) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	if (!adminRTDB) {
		return { ok: false, error: 'RTDB_UNAVAILABLE' };
	}

	try {
		const typingRef = adminRTDB.ref(`liveSessions/${sessionId}/typing/${userUid}`);

		if (isTyping) {
			const payload: TypingPayload = {
				displayName: displayName || 'Unknown',
				avatarUrl: avatarUrl || null,
				startedAt: new Date().toISOString(),
			};
			await typingRef.set(payload);
		} else {
			await typingRef.remove();
		}

		return { ok: true, data: null };
	} catch (err) {
		return { ok: false, error: 'TYPING_UPDATE_FAILED', reason: (err as Error).message };
	}
}

/**
 * clearUserTyping
 * - Explicit cleanup for typing indicator
 */
export async function clearUserTyping(params: {
	sessionId: string;
	userUid: string;
}): Promise<ServerResult<null>> {
	const { sessionId, userUid } = params;

	if (sessionId.length === 0 || userUid.length === 0) {
		return { ok: false, error: 'INVALID_INPUT' };
	}

	if (!adminRTDB) {
		return { ok: false, error: 'RTDB_UNAVAILABLE' };
	}

	try {
		await adminRTDB.ref(`liveSessions/${sessionId}/typing/${userUid}`).remove();
		return { ok: true, data: null };
	} catch (err) {
		return { ok: false, error: 'TYPING_CLEAR_FAILED', reason: (err as Error).message };
	}
}
