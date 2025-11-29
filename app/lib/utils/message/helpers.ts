import type { DataSnapshot } from 'firebase/database';

import type { CachedUser, ChatMessage, RTDBMessage } from '@/app/lib/types';
import { EMOJI_SHORTCUTS } from '@/app/lib/types';
import { compare, create } from '@/app/lib/utils/time';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function getStr(obj: Record<string, unknown>, key: string): string | undefined {
	return typeof obj[key] === 'string' ? (obj[key] as string) : undefined;
}

function getNum(obj: Record<string, unknown>, key: string): number | undefined {
	return typeof obj[key] === 'number' ? (obj[key] as number) : undefined;
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
		status: msg.status ?? 'delivered',
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
		status: (getStr(rec, 'status') || 'delivered') as ChatMessage['status'],
		createdAt: createdAtField ?? new Date().toISOString(),
	};
}

export function parseTypingUserFromSnapshot(snap: DataSnapshot): CachedUser | null {
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

export function compareMsgsAsc(a: ChatMessage, b: ChatMessage): number {
	const timeCompare = compare.asc(a.createdAt, b.createdAt);
	
	if (timeCompare === 0) {
		const aId = a.id ?? '';
		const bId = b.id ?? '';
		return aId.localeCompare(bId);
	}
	
	return timeCompare;
}

export function emojify(text: string): string {
	if (!text) return '';

	const pattern = new RegExp(
		`(${Object.keys(EMOJI_SHORTCUTS)
			.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
			.join('|')})`,
		'g'
	);

	return text.replace(pattern, (match) => EMOJI_SHORTCUTS[match] || match);
}
