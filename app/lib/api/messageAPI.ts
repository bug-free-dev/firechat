'use server';

import { adminRTDB } from '@/app/lib/firebase/FireAdmin';
import type { ChatMessage, RTDBMessage, ServerResult } from '@/app/lib/types';
import { parseRTDBMessage, sanitizeMessageForRTDB } from '@/app/lib/utils/message/helpers';
import type {
	DeleteMessageParams,
	GetMessagesParams,
	ReactionParams,
	SendMessagePayload,
} from '@/app/lib/utils/message/typeDefs';
import { validateSendMessagePayload } from '@/app/lib/utils/message/validator';
import { compare, create } from '@/app/lib/utils/time';

/* <------------------- CONSTANTS -------------------> */

const MAX_MESSAGE_FETCH_LIMIT = 200;
const DEFAULT_FETCH_LIMIT = 50;

/* <------------------- SEND MESSAGE -------------------> */

/**
 * Send a new message to a session
 * @param payload - Message data
 * @returns Result with created message or error
 */
export async function sendMessage(payload: SendMessagePayload): Promise<ServerResult<ChatMessage>> {
	const validationError = validateSendMessagePayload(payload);
	if (validationError) return validationError;

	const { sessionId, senderUid, type = 'markdown', text, replyTo, extras } = payload;
	const trimmedText = text.trim();

	try {
		if (!adminRTDB)
			return { ok: false, error: 'RTDB_UNAVAILABLE', reason: 'Admin RTDB not initialized' };

		const sessionSnap = await adminRTDB.ref(`liveSessions/${sessionId}`).get();
		if (!sessionSnap.exists())
			return { ok: false, error: 'SESSION_NOT_FOUND', reason: 'Session does not exist' };

		const sessionVal = sessionSnap.val() as {
			metadata?: { status?: string };
			participants?: Record<string, unknown>;
		};
		if (sessionVal.metadata?.status !== 'active')
			return { ok: false, error: 'SESSION_INACTIVE', reason: 'Session is not active' };
		if (
			!sessionVal.participants ||
			!Object.prototype.hasOwnProperty.call(sessionVal.participants, senderUid)
		) {
			return {
				ok: false,
				error: 'NOT_PARTICIPANT',
				reason: 'User is not a participant in this session',
			};
		}

		const messageRef = adminRTDB.ref(`liveMessages/${sessionId}`).push();
		const messageId = messageRef.key;
		if (!messageId)
			return { ok: false, error: 'FAILED', reason: 'Could not generate message ID' };

		const now = create.nowISO();
		const message: ChatMessage = {
			id: messageId,
			roomId: sessionId,
			sessionId,
			sender: senderUid,
			type,
			text: trimmedText,
			replyTo: replyTo?.trim() || undefined,
			reactions: {},
			extras,
			status: 'delivered',
			createdAt: now,
		};

		const rtdbPayload = sanitizeMessageForRTDB(message);

		const updates: Record<string, unknown> = {
			[`liveMessages/${sessionId}/${messageId}`]: rtdbPayload,
			[`liveSessions/${sessionId}/metadata/updatedAt`]: now,
		};
		await adminRTDB.ref().update(updates);

		return { ok: true, data: message };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return { ok: false, error: 'FAILED', reason: errorMessage };
	}
}

/* <------------------- GET MESSAGES -------------------> */

/**
 * Fetch messages from a session
 * @param params - Query parameters
 * @returns Result with messages array or error
 */
export async function getMessages(params: GetMessagesParams): Promise<ServerResult<ChatMessage[]>> {
	const { sessionId, limit = DEFAULT_FETCH_LIMIT, before } = params;

	if (!sessionId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'sessionId is required' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE', reason: 'Admin RTDB not initialized' };
		}

		/* <--- Build query ---> */
		const messagesRef = adminRTDB.ref(`liveMessages/${sessionId}`);
		const safeLimit = Math.min(Math.max(1, limit), MAX_MESSAGE_FETCH_LIMIT);

		let query = messagesRef.orderByChild('createdAt').limitToLast(safeLimit);

		/* <--- Apply 'before' filter if provided ---> */
		if (before) {
			const beforeMs = Date.parse(before);
			if (!isNaN(beforeMs)) {
				query = messagesRef.orderByChild('createdAt').endBefore(before).limitToLast(safeLimit);
			}
		}

		/* <--- Fetch and parse messages ---> */
		const snap = await query.get();
		if (!snap.exists()) {
			return { ok: true, data: [] };
		}

		const messages: ChatMessage[] = [];
		snap.forEach((childSnap) => {
			const data = childSnap.val() as RTDBMessage;
			const messageId = childSnap.key;
			if (messageId) {
				messages.push(parseRTDBMessage(messageId, data));
			}
		});

		/* <--- Sort ascending by creation time ---> */
		messages.sort((a, b) => compare.asc(a.createdAt, b.createdAt));

		return { ok: true, data: messages };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return { ok: false, error: 'FAILED', reason: errorMessage };
	}
}

/* <------------------- ADD REACTION -------------------> */

/**
 * Add a reaction to a message
 * @param params - Reaction parameters
 * @returns Result with null or error
 */
export async function addReaction(params: ReactionParams): Promise<ServerResult<null>> {
	const { messageId, sessionId, userId, emoji } = params;

	/* <--- Validate inputs ---> */
	if (!messageId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'messageId is required' };
	}
	if (!sessionId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'sessionId is required' };
	}
	if (!userId?.trim()) {
		return { ok: false, error: 'AUTH_REQUIRED', reason: 'userId is required' };
	}
	if (!emoji?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'emoji is required' };
	}
	if (emoji.length > 10) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'emoji too long' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE', reason: 'Admin RTDB not initialized' };
		}

		/* <--- Get message ---> */
		const msgRef = adminRTDB.ref(`liveMessages/${sessionId}/${messageId}`);
		const snap = await msgRef.get();

		if (!snap.exists()) {
			return { ok: false, error: 'MESSAGE_NOT_FOUND', reason: 'Message does not exist' };
		}

		/* <--- Parse current reactions ---> */
		const data = snap.val() as RTDBMessage;
		const reactions = { ...(data.reactions ?? {}) };
		const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

		/* <--- Add user if not already reacted ---> */
		if (!users.includes(userId)) {
			users.push(userId);
			reactions[emoji] = users;
			await msgRef.update({ reactions });
		}

		return { ok: true, data: null };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return { ok: false, error: 'FAILED', reason: errorMessage };
	}
}

/* <------------------- REMOVE REACTION -------------------> */

/**
 * Remove a reaction from a message
 * @param params - Reaction parameters
 * @returns Result with null or error
 */
export async function removeReaction(params: ReactionParams): Promise<ServerResult<null>> {
	const { messageId, sessionId, userId, emoji } = params;

	/* <--- Validate inputs ---> */
	if (!messageId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'messageId is required' };
	}
	if (!sessionId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'sessionId is required' };
	}
	if (!userId?.trim()) {
		return { ok: false, error: 'AUTH_REQUIRED', reason: 'userId is required' };
	}
	if (!emoji?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'emoji is required' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE', reason: 'Admin RTDB not initialized' };
		}

		/* <--- Get message ---> */
		const msgRef = adminRTDB.ref(`liveMessages/${sessionId}/${messageId}`);
		const snap = await msgRef.get();

		if (!snap.exists()) {
			return { ok: false, error: 'MESSAGE_NOT_FOUND', reason: 'Message does not exist' };
		}

		/* <--- Parse current reactions ---> */
		const data = snap.val() as RTDBMessage;
		const reactions = { ...(data.reactions ?? {}) };
		const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

		/* <--- Remove user from reaction ---> */
		const idx = users.indexOf(userId);
		if (idx !== -1) {
			users.splice(idx, 1);

			if (users.length > 0) {
				reactions[emoji] = users;
			} else {
				delete reactions[emoji];
			}

			await msgRef.update({ reactions });
		}

		return { ok: true, data: null };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return { ok: false, error: 'FAILED', reason: errorMessage };
	}
}

/* <------------------- DELETE MESSAGE -------------------> */

/**
 * Delete a message from a session
 * @param params - Delete parameters
 * @returns Result with null or error
 */
export async function deleteMessage(params: DeleteMessageParams): Promise<ServerResult<null>> {
	const { messageId, sessionId, callerUid } = params;

	/* <--- Validate inputs ---> */
	if (!messageId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'messageId is required' };
	}
	if (!sessionId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'sessionId is required' };
	}
	if (!callerUid?.trim()) {
		return { ok: false, error: 'AUTH_REQUIRED', reason: 'callerUid is required' };
	}

	try {
		if (!adminRTDB) {
			return { ok: false, error: 'RTDB_UNAVAILABLE', reason: 'Admin RTDB not initialized' };
		}

		/* <--- Get message ---> */
		const msgRef = adminRTDB.ref(`liveMessages/${sessionId}/${messageId}`);
		const snap = await msgRef.get();

		if (!snap.exists()) {
			return { ok: false, error: 'MESSAGE_NOT_FOUND', reason: 'Message does not exist' };
		}

		const data = snap.val() as RTDBMessage;

		/* <--- Check permissions ---> */
		const sessionSnap = await adminRTDB.ref(`liveSessions/${sessionId}/metadata`).get();
		const creator = sessionSnap.val()?.creator;

		const isSender = data.sender === callerUid;
		const isCreator = creator === callerUid;

		if (!isSender && !isCreator) {
			return {
				ok: false,
				error: 'NOT_ALLOWED',
				reason: 'Only sender or session creator can delete',
			};
		}

		/* <--- Delete message ---> */
		await msgRef.remove();

		return { ok: true, data: null };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return { ok: false, error: 'FAILED', reason: errorMessage };
	}
}
