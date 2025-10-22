import type { DataSnapshot } from 'firebase/database';

import type { ChatMessage, FireCachedUser, RTDBMessage } from '@/app/lib/types';
import { EMOJI_SHORTCUTS } from '@/app/lib/types';
import { compare, create } from '@/app/lib/utils/time';

import { OptimisticMessage } from './typeDefs';

/* <------- TYPE GUARDS -------> */

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/* <------- FIELD EXTRACTORS -------> */

function getStr(obj: Record<string, unknown>, key: string): string | undefined {
	return typeof obj[key] === 'string' ? (obj[key] as string) : undefined;
}

function getNum(obj: Record<string, unknown>, key: string): number | undefined {
	return typeof obj[key] === 'number' ? (obj[key] as number) : undefined;
}

/* <------- PARSERS -------> */

/**
 * Parse reactions from RTDB data
 */
export function parseReactions(reactionsData: unknown): Record<string, string[]> {
	if (!isRecord(reactionsData)) return {};

	const result: Record<string, string[]> = {};
	for (const [emoji, users] of Object.entries(reactionsData)) {
		if (isStringArray(users)) {
			result[emoji] = users;
		}
	}
	return result;
}

/**
 * Sanitize message for RTDB storage
 */
export function sanitizeMessageForRTDB(msg: ChatMessage): Record<string, unknown> {
	const sanitized: Record<string, unknown> = {
		id: msg.id,
		roomId: msg.roomId,
		sessionId: msg.sessionId ?? msg.roomId,
		sender: msg.sender,
		type: msg.type,
		text: msg.text,
		reactions: msg.reactions ?? {},
		status: msg.status ?? 'sent',
		createdAt: msg.createdAt ?? create.nowISO(),
	};

	if (msg.replyTo) {
		sanitized.replyTo = msg.replyTo;
	}

	if (msg.extras) {
		sanitized.extras = msg.extras;
	}

	return sanitized;
}

/**
 * Parse RTDB message to ChatMessage
 */
export function parseRTDBMessage(messageId: string, data: RTDBMessage): ChatMessage {
	return {
		id: messageId,
		roomId: data.roomId,
		sessionId: data.sessionId,
		sender: data.sender,
		type: data.type,
		text: data.text,
		replyTo: data.replyTo,
		reactions: data.reactions ?? {},
		extras: data.extras,
		status: data.status,
		createdAt: data.createdAt,
	};
}

/**
 * Parse message from RTDB snapshot
 */
export function parseMessageFromSnapshot(
	snap: DataSnapshot,
	defaultSessionId: string
): ChatMessage | null {
	const val = snap.val();
	if (!isRecord(val)) return null;

	const id = snap.key;
	if (!id) return null;

	const rec = val;
	const roomIdField = getStr(rec, 'roomId');
	const sessionIdField = getStr(rec, 'sessionId');
	const senderField = getStr(rec, 'sender');
	const textField = getStr(rec, 'text');
	const replyToField = getStr(rec, 'replyTo');
	const createdAtField = getStr(rec, 'createdAt');

	// Compute roomId
	let roomId = defaultSessionId;
	if (roomIdField) roomId = roomIdField;
	else if (sessionIdField) roomId = sessionIdField;

	return {
		id,
		roomId,
		sessionId: sessionIdField ?? defaultSessionId,
		sender: senderField ?? '',
		type: 'markdown',
		text: textField ?? '',
		replyTo: replyToField,
		reactions: parseReactions(rec.reactions),
		extras: isRecord(rec.extras) ? rec.extras : undefined,
		status: (getStr(rec, 'status') as ChatMessage['status']) ?? 'read',
		createdAt: createdAtField ?? new Date().toISOString(),
	};
}

/**
 * Parse typing user from RTDB snapshot
 */
export function parseTypingUserFromSnapshot(snap: DataSnapshot): FireCachedUser | null {
	const key = snap.key;
	if (!key) return null;

	const val = snap.val();
	if (!isRecord(val)) return null;

	const rec = val;
	const usernamey = getStr(rec, 'usernamey');
	const displayNameField = getStr(rec, 'displayName');

	const displayName = displayNameField ?? usernamey ?? key;
	const usernameyNormalized = (usernamey ?? displayName).toLowerCase();

	return {
		uid: key,
		usernamey: usernameyNormalized,
		displayName,
		avatarUrl: getStr(rec, 'avatarUrl') ?? null,
		kudos: getNum(rec, 'kudos') ?? 0,
		createdAt: getStr(rec, 'createdAt') ?? new Date().toISOString(),
		lastSeen: getStr(rec, 'startedAt') ?? new Date().toISOString(),
		meta: isRecord(rec.meta) ? rec.meta : undefined,
	};
}

/* <------- HELPERS -------> */

/**
 * Sort messages ascending by creation time
 */
export function compareMsgsAsc(a: ChatMessage, b: ChatMessage): number {
	return compare.asc(a.createdAt, b.createdAt);
}

const OPTIMISTIC_ID_PREFIX = 'opt_';

export function generateOptimisticId(): string {
   return `${OPTIMISTIC_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createOptimisticMessage(
   text: string,
   userUid: string,
   sessionId: string,
   replyTo?: string,
   extras?: Record<string, unknown>
): OptimisticMessage {
   const now = new Date().toISOString();
   const optimisticId = generateOptimisticId();

   return {
      id: optimisticId,
      roomId: sessionId,
      sessionId,
      sender: userUid,
      type: 'markdown',
      text,
      createdAt: now,
      replyTo: replyTo || null,
      reactions: {},
      _optimistic: true,
      _timestamp: Date.now(),
      ...(extras || {}),
   } as OptimisticMessage;
}

/**
 * Replaces emoji shortcuts like ":smile:" with actual emoji characters.
 * - Ignores shortcuts inside URLs.
 * - Efficient for large messages.
 */
export function emojify(text: string): string {
	if (!text) return '';

	// Build regex dynamically like /(:smile:|:fire:|:heart:)/g
	const pattern = new RegExp(
		`(${Object.keys(EMOJI_SHORTCUTS)
			.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
			.join('|')})`,
		'g'
	);

	return text.replace(pattern, (match) => EMOJI_SHORTCUTS[match] || match);
}
