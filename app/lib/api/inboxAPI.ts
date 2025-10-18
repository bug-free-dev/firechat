'use server';

import { adminRTDB } from '@/app/lib/firebase/FireAdmin';
import type { InboxInviteItem, InboxThread, ServerResult } from '@/app/lib/types';
import { compare } from '@/app/lib/utils/time';

/**
 * markInboxRead
 * - Mark a single thread as read
 */
export async function markInboxRead(params: {
	userUid: string;
	threadId: string;
}): Promise<ServerResult<null>> {
	const { userUid, threadId } = params;

	if (!userUid || !threadId) return { ok: false, error: 'INVALID_INPUT' };
	if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

	try {
		const path = `inbox/${userUid}/${threadId}/read`;
		await adminRTDB.ref(path).set(true);
		return { ok: true, data: null };
	} catch (err) {
		return { ok: false, error: 'MARK_READ_FAILED', reason: (err as Error).message };
	}
}

/**
 * removeInboxThread
 * - Delete a thread entirely
 */
export async function removeInboxThread(params: {
	userUid: string;
	threadId: string;
}): Promise<ServerResult<null>> {
	const { userUid, threadId } = params;

	if (!userUid || !threadId) return { ok: false, error: 'INVALID_INPUT' };
	if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

	try {
		const path = `inbox/${userUid}/${threadId}`;
		await adminRTDB.ref(path).remove();
		return { ok: true, data: null };
	} catch (err) {
		return { ok: false, error: 'REMOVE_FAILED', reason: (err as Error).message };
	}
}

/**
 * getInboxThreads
 * - Server-side read (optional: use for initial load, then switch to client listeners)
 */
export async function getInboxThreads(params: {
	userUid: string;
	limit?: number;
}): Promise<ServerResult<InboxThread[]>> {
	const { userUid, limit = 50 } = params;

	if (!userUid) return { ok: false, error: 'INVALID_INPUT' };
	if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

	try {
		const snap = await adminRTDB
			.ref(`inbox/${userUid}`)
			.orderByChild('createdAt')
			.limitToLast(limit)
			.get();

		if (!snap.exists()) return { ok: true, data: [] };

		const threads: InboxThread[] = [];
		snap.forEach((childSnap) => {
			const key = childSnap.key;
			const val = childSnap.val() as InboxInviteItem;

			if (!key || !val) return;

			threads.push({
				id: key,
				participants: [val.from, userUid],
				lastMessage: {
					text: val.message,
					sender: val.from,
					timestamp: val.createdAt,
				},
				unreadCount: val.read ? 0 : 1,
				raw: val,
			});
		});

		// Sort desc by timestamp
		threads.sort((a, b) => compare.desc(a.lastMessage?.timestamp, b.lastMessage?.timestamp));

		return { ok: true, data: threads };
	} catch (err) {
		return { ok: false, error: 'FETCH_FAILED', reason: (err as Error).message };
	}
}
