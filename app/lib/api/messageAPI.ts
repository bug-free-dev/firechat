'use server';

import { ChatMessage, RTDBMessage, ServerResult } from '@/app/lib/types';

import { adminRTDB } from '../firebase/FireAdmin';
import { parseRTDBMessage, sanitizeMessageForRTDB } from '../utils/message/utils';
import { compare, create } from '../utils/time';

/* ==================== SEND MESSAGE ==================== */

export async function sendMessage(payload: {
	sessionId: string;
	senderUid: string;
	type?: ChatMessage['type'];
	text: string;
	replyTo?: string;
	extras?: Record<string, unknown>;
}): Promise<ServerResult<ChatMessage>> {
	const { sessionId, senderUid, type = 'markdown', text, replyTo, extras } = payload;

	if (!sessionId) return { ok: false, error: 'INVALID_INPUT', reason: 'sessionId required' };
	if (!senderUid) return { ok: false, error: 'AUTH_REQUIRED' };
	if (!text || !String(text).trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'text required' };
	}

	try {
		if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

		// Verify session exists and user is participant
		const sessionSnap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!sessionSnap.exists()) return { ok: false, error: 'SESSION_NOT_FOUND' };

		const sessionVal = sessionSnap.val() as {
			metadata?: { status: string };
			participants?: Record<string, unknown>;
		};

		if (sessionVal.metadata?.status !== 'active') {
			return { ok: false, error: 'SESSION_INACTIVE' };
		}

		if (!sessionVal.participants?.[senderUid]) {
			return { ok: false, error: 'NOT_PARTICIPANT' };
		}

		// Generate message
		const messageId = adminRTDB.ref(`liveMessages/${sessionId}`).push().key;
		if (!messageId)
			return { ok: false, error: 'FAILED', reason: 'Could not generate message ID' };

		const now = create.nowISO();

		const message: ChatMessage = {
			id: messageId,
			roomId: sessionId,
			sessionId,
			sender: senderUid,
			type,
			text: String(text).trim(),
			replyTo: replyTo ? String(replyTo) : undefined,
			reactions: {},
			extras,
			status: 'sent',
			createdAt: now,
		};

		const rtdbPayload = sanitizeMessageForRTDB(message);

		// Write to RTDB (primary storage)
		await adminRTDB.ref(`liveMessages/${sessionId}/${messageId}`).set(rtdbPayload);

		// Update session's lastMessage metadata
		await adminRTDB.ref(`liveSessions/${sessionId}/metadata/updatedAt`).set(now);

		return { ok: true, data: message };
	} catch (err) {
		return { ok: false, error: 'FAILED', reason: (err as Error).message };
	}
}

/* ==================== GET MESSAGES ==================== */

export async function getMessages(params: {
	sessionId: string;
	limit?: number;
	before?: string;
}): Promise<ServerResult<ChatMessage[]>> {
	const { sessionId, limit = 50, before } = params;

	if (!sessionId) return { ok: false, error: 'INVALID_INPUT' };

	try {
		if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

		const messagesRef = adminRTDB.ref(`liveMessages/${sessionId}`);

		// Query messages ordered by createdAt
		let query = messagesRef.orderByChild('createdAt').limitToLast(Math.min(limit, 200));

		// If 'before' timestamp provided, filter messages created before that time
		if (before) {
			const beforeMs = Date.parse(before);
			if (!isNaN(beforeMs)) {
				query = messagesRef
					.orderByChild('createdAt')
					.endBefore(before)
					.limitToLast(Math.min(limit, 200));
			}
		}

		const snap = await query.get();
		if (!snap.exists()) return { ok: true, data: [] };

		const messages: ChatMessage[] = [];
		snap.forEach((childSnap) => {
			const data = childSnap.val() as RTDBMessage;
			messages.push(parseRTDBMessage(childSnap.key!, data));
		});

		// Sort by createdAt ascending (oldest first)
		// Sort by createdAt ascending (oldest first)
		messages.sort((a, b) => compare.asc(a.createdAt, b.createdAt));

		return { ok: true, data: messages };
	} catch (err) {
		return { ok: false, error: 'FAILED', reason: (err as Error).message };
	}
}

/* ==================== ADD REACTION ==================== */

export async function addReaction(params: {
	messageId: string;
	sessionId: string;
	userId: string;
	emoji: string;
}): Promise<ServerResult<null>> {
	const { messageId, sessionId, userId, emoji } = params;

	if (!messageId) return { ok: false, error: 'INVALID_INPUT' };
	if (!sessionId) return { ok: false, error: 'INVALID_INPUT' };
	if (!userId) return { ok: false, error: 'AUTH_REQUIRED' };
	if (!emoji) return { ok: false, error: 'INVALID_INPUT' };

	try {
		if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

		const msgRef = adminRTDB.ref(`liveMessages/${sessionId}/${messageId}`);
		const snap = await msgRef.get();

		if (!snap.exists()) return { ok: false, error: 'MESSAGE_NOT_FOUND' };

		const data = snap.val() as RTDBMessage;
		const reactions = { ...(data.reactions ?? {}) };
		const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

		if (!users.includes(userId)) {
			users.push(userId);
		}

		reactions[emoji] = users;

		await msgRef.update({ reactions });

		return { ok: true, data: null };
	} catch (err) {
		return { ok: false, error: 'FAILED', reason: (err as Error).message };
	}
}

/* ==================== REMOVE REACTION ==================== */

export async function removeReaction(params: {
	messageId: string;
	sessionId: string;
	userId: string;
	emoji: string;
}): Promise<ServerResult<null>> {
	const { messageId, sessionId, userId, emoji } = params;

	if (!messageId) return { ok: false, error: 'INVALID_INPUT' };
	if (!sessionId) return { ok: false, error: 'INVALID_INPUT' };
	if (!userId) return { ok: false, error: 'AUTH_REQUIRED' };
	if (!emoji) return { ok: false, error: 'INVALID_INPUT' };

	try {
		if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

		const msgRef = adminRTDB.ref(`liveMessages/${sessionId}/${messageId}`);
		const snap = await msgRef.get();

		if (!snap.exists()) return { ok: false, error: 'MESSAGE_NOT_FOUND' };

		const data = snap.val() as RTDBMessage;
		const reactions = { ...(data.reactions ?? {}) };
		const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

		const idx = users.indexOf(userId);
		if (idx !== -1) {
			users.splice(idx, 1);
		}

		if (users.length > 0) {
			reactions[emoji] = users;
		} else {
			delete reactions[emoji];
		}

		await msgRef.update({ reactions });

		return { ok: true, data: null };
	} catch (err) {
		return { ok: false, error: 'FAILED', reason: (err as Error).message };
	}
}

/* ==================== DELETE MESSAGE (Optional) ==================== */

export async function deleteMessage(params: {
	messageId: string;
	sessionId: string;
	callerUid: string;
}): Promise<ServerResult<null>> {
	const { messageId, sessionId, callerUid } = params;

	if (!messageId) return { ok: false, error: 'INVALID_INPUT' };
	if (!sessionId) return { ok: false, error: 'INVALID_INPUT' };
	if (!callerUid) return { ok: false, error: 'AUTH_REQUIRED' };

	try {
		if (!adminRTDB) return { ok: false, error: 'RTDB_UNAVAILABLE' };

		const msgRef = adminRTDB.ref(`liveMessages/${sessionId}/${messageId}`);
		const snap = await msgRef.get();

		if (!snap.exists()) return { ok: false, error: 'MESSAGE_NOT_FOUND' };

		const data = snap.val() as RTDBMessage;

		// Only sender or session creator can delete
		const sessionSnap = await adminRTDB.ref(`liveSessions/${sessionId}/metadata`).get();
		const creator = sessionSnap.val()?.creator;

		if (data.sender !== callerUid && creator !== callerUid) {
			return { ok: false, error: 'NOT_ALLOWED' };
		}

		await msgRef.remove();

		return { ok: true, data: null };
	} catch (err) {
		return { ok: false, error: 'FAILED', reason: (err as Error).message };
	}
}
