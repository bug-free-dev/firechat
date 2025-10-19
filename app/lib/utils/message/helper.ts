import type { DataSnapshot } from 'firebase/database';
import { isEqual } from 'lodash-es';

import type { ChatMessage, FireCachedUser, MessageAttachment, RTDBMessage } from '@/app/lib/types';
import { compare, create } from '@/app/lib/utils/time';

/* <------- TYPE GUARDS -------> */

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isAttachment(value: unknown): value is MessageAttachment {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.type === 'string' &&
		typeof value.url === 'string'
	);
}

function isAttachmentArray(value: unknown): value is MessageAttachment[] {
	return Array.isArray(value) && value.every(isAttachment);
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
 * Parse attachments from RTDB data
 */
export function parseAttachments(attachmentsData: unknown): MessageAttachment[] {
	if (!isAttachmentArray(attachmentsData)) return [];
	return attachmentsData;
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

	if (msg.attachments?.length) {
		sanitized.attachments = msg.attachments;
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
		attachments: data.attachments ?? [],
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
		attachments: parseAttachments(rec.attachments),
		extras: isRecord(rec.extras) ? rec.extras : undefined,
		status: (getStr(rec, 'status') as ChatMessage['status']) ?? 'delivered',
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

/**
 * Check if URL is from Firebase Storage (security)
 */
export function isFirebaseStorageUrl(url: string): boolean {
	return url.startsWith('https://firebasestorage.googleapis.com/');
}

/**
 * Validate attachment URLs (security check)
 */
export function validateAttachmentUrls(attachments: readonly MessageAttachment[]): boolean {
	return attachments.every((att) => isFirebaseStorageUrl(att.url));
}

/** Generate a stable-enough client temporary id for optimistic messages */
export const genTempId = (): string =>
	`tmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Cheap content comparison: used to match a server message to a pre-existing temp message.
 * We avoid deep compare for the common fast path; fallback to lodash 'isEqual' for attachments/extras.
 */
export const matchMessageContent = (a: ChatMessage, b: ChatMessage): boolean => {
	if (!a || !b) return false;
	if (a.sender !== b.sender) return false;
	if ((a.text ?? '') !== (b.text ?? '')) return false;
	if ((a.replyTo ?? '') !== (b.replyTo ?? '')) return false;

	const aAtt = a.attachments ?? [];
	const bAtt = b.attachments ?? [];
	if (aAtt.length !== bAtt.length) return false;

	for (let i = 0; i < aAtt.length; i++) {
		if (aAtt[i].url !== bAtt[i].url) {
			return isEqual(a.attachments, b.attachments) && isEqual(a.extras || {}, b.extras || {});
		}
	}

	// attachments urls all match, treat as same content
	return true;
};
