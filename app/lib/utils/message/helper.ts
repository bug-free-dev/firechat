import { type DataSnapshot } from 'firebase/database';

import type { ChatMessage, FireCachedUser, RTDBMessage } from '@/app/lib/types';
import { compare, create } from '@/app/lib/utils/time';

/* ==================== TYPE GUARDS ==================== */

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

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

	if (msg.replyTo) sanitized.replyTo = msg.replyTo;
	if (msg.extras) sanitized.extras = msg.extras;

	return sanitized;
}

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

// small helpers
function getStr(obj: Record<string, unknown>, key: string): string | undefined {
	return typeof obj[key] === 'string' ? obj[key] : undefined;
}
function getNum(obj: Record<string, unknown>, key: string): number | undefined {
	return typeof obj[key] === 'number' ? obj[key] : undefined;
}

export function parseMessageFromSnapshot(
	snap: DataSnapshot,
	defaultSessionId: string
): ChatMessage | null {
	const val = snap.val();
	if (!isRecord(val)) return null;

	const rec = val;
	const id = snap.key;
	if (!id) return null;

	const roomIdField = getStr(rec, 'roomId');
	const sessionIdField = getStr(rec, 'sessionId');
	const senderField = getStr(rec, 'sender');
	const typeField = getStr(rec, 'type');
	const textField = getStr(rec, 'text');
	const replyToField = getStr(rec, 'replyTo');
	const createdAtField = getStr(rec, 'createdAt');

	// compute roomId without nested ternary
	let roomId = defaultSessionId;
	if (roomIdField) roomId = roomIdField;
	else if (sessionIdField) roomId = sessionIdField;

	const parsedType = typeField === 'markdown' || typeField === 'system' ? typeField : 'markdown';

	return {
		id,
		roomId,
		sessionId: sessionIdField ?? defaultSessionId,
		sender: senderField ?? '',
		type: parsedType,
		text: textField ?? '',
		replyTo: replyToField ?? undefined,
		reactions: parseReactions(rec.reactions),
		extras: isRecord(rec.extras) ? rec.extras : undefined,
		status: (getStr(rec, 'status') as ChatMessage['status']) ?? undefined,
		createdAt: createdAtField ?? new Date().toISOString(),
	};
}

export function parseTypingUserFromSnapshot(snap: DataSnapshot): FireCachedUser | null {
	const { key } = snap;
	if (!key) return null;

	const val = snap.val();
	if (!isRecord(val)) return null;

	const rec = val;

	const usernamey = getStr(rec, 'usernamey');
	const displayNameField = getStr(rec, 'displayName');

	// pick displayName fallback (no nested ternary)
	const displayName = displayNameField ?? usernamey ?? key;
	const usernameyNormalized = (usernamey ?? displayName).toLowerCase();

	const avatarUrlField = getStr(rec, 'avatarUrl');
	const kudosField = getNum(rec, 'kudos') ?? 0;
	const createdAtField = getStr(rec, 'createdAt');
	const startedAtField = getStr(rec, 'startedAt');

	return {
		uid: key,
		usernamey: usernameyNormalized,
		displayName,
		avatarUrl: avatarUrlField ?? null,
		kudos: kudosField,
		createdAt: createdAtField ?? new Date().toISOString(),
		lastSeen: startedAtField ?? new Date().toISOString(),
		meta: isRecord(rec.meta) ? rec.meta : undefined,
	};
}

/* ==================== HELPERS ==================== */

export function compareMsgsAsc(a: ChatMessage, b: ChatMessage): number {
	return compare.asc(a.createdAt, b.createdAt);
}
