import type { FireTime } from '@/app/lib/utils/time';

/* ==================== PRIMITIVES ==================== */

export type UID = string;
export type ID = string;

/* ==================== USER PROFILE ==================== */

/**
 * Canonical user profile from server.
 * Single source of truth for user data on client.
 */
export interface FireProfile {
	uid: UID;
	displayName: string;
	usernamey: string;
	identifierKey: string;
	onboarded: boolean;
	isBanned: boolean;

	// Optional user details
	mood?: string | null;
	quirks?: string[];
	tags?: string[];
	status?: string | null;
	about?: string | null;
	avatarUrl?: string | null;

	// Kudos economy
	kudos: number;
	kudosGiven?: number;
	kudosReceived?: number;

	// Timestamps
	createdAt?: FireTime;
	lastSeen?: FireTime;

	// Extensible metadata
	meta?: Record<string, unknown>;
}

/**
 * Lightweight cached user representation.
 * Suitable for client-side caching and transfer.
 */
export interface FireCachedUser {
	uid: UID;
	usernamey: string;
	displayName: string;
	avatarUrl?: string | null;
	kudos: number;
	isBanned?: boolean;
	createdAt?: FireTime;
	lastSeen?: FireTime;
	meta?: Record<string, unknown>;
}

/**
 * Client-side user cache structure.
 * JSON-friendly for easy storage/transfer.
 */
export interface FireUserCache {
	byUsername: Record<string, FireCachedUser>;
	byUid: Record<string, FireCachedUser>;
	timestamp: number;
	meta?: Record<string, unknown>;
}

/* ==================== KUDOS / TRANSACTIONS ==================== */

/**
 * Kudos transaction log entry.
 * Stored at /kudos/{txnId}.
 */
export interface KudosTxn {
	id?: ID;
	from: UID | 'SYSTEM';
	to: UID;
	amount: number;
	type: 'gift' | 'reward' | 'purchase' | 'system';
	note?: string | null;
	createdAt: FireTime;
}

/* ==================== SESSIONS ==================== */

/**
 * Session document structure.
 * Identifier-based access control (no passcode).
 */
export interface SessionDoc {
	id?: ID;
	title?: string;
	creator: UID;
	participants: UID[];
	joinedUsers?: UID[];
	isLocked: boolean;
	identifierRequired: boolean;
	isActive: boolean;
	createdAt?: FireTime;
	endedAt?: FireTime;
	lastTouchedAt?: FireTime;
	meta?: {
		invitedUids?: string[];
		[key: string]: unknown;
	};
}

/**
 * RTDB session metadata node.
 */
export interface RTDBSessionMetadata {
	id: string;
	title: string;
	creator: string;
	isLocked: boolean;
	identifierRequired: boolean;
	status: 'active' | 'ended';
	createdAt: string;
	updatedAt: string;
}

/**
 * RTDB invited user entry.
 */
export interface RTDBInvitedUser {
	invitedAt: string;
	displayName: string;
	avatarUrl?: string | null;
}

/**
 * RTDB participant entry.
 */
export interface RTDBParticipant {
	joinedAt: string;
	displayName: string;
	avatarUrl?: string | null;
	status: 'active' | 'away';
}

/* ==================== CHAT MESSAGES ==================== */

/**
 * Persistent chat message structure.
 */
export interface ChatMessage {
	id?: ID;
	roomId: string;
	sessionId?: string;
	sender: UID;
	type: 'markdown' | 'system';
	text: string;
	replyTo?: ID;
	reactions?: Record<string, UID[]>;
	extras?: Record<string, unknown>;
	status?: 'sent' | 'delivered' | 'read';
	createdAt?: FireTime;
}

/**
 * RTDB realtime message shape.
 */
export interface RTDBMessage {
	id: ID;
	roomId: string;
	sessionId: string;
	sender: UID;
	type: 'markdown' | 'system';
	text: string;
	replyTo?: ID;
	reactions: Record<string, UID[]>;
	extras?: Record<string, unknown>;
	status: 'sent' | 'delivered' | 'read';
	createdAt: string;
}

/* ==================== INBOX / THREADS ==================== */

export interface InboxInviteItem {
	type: 'invite';
	from: UID;
	sessionId: string;
	message: string;
	createdAt: FireTime;
	read: boolean;
}

export interface InboxThread {
	id: ID;
	participants: UID[];
	lastMessage?: {
		text: string;
		sender: UID;
		timestamp: FireTime;
	};
	unreadCount?: number;
	raw?: InboxInviteItem;
}

/* ==================== SERVER RESULTS ==================== */

export type ResultOk<T> = { ok: true; data: T };
export type ResultErr = { ok: false; error: string; reason?: string };
export type ServerResult<T> = ResultOk<T> | ResultErr;

/* ==================== AUTH ==================== */

export interface AuthError {
	message: string;
	code?: string;
}

export type AuthResult =
	| { ok: true; data: { user: FireProfile } }
	| { ok: false; error: AuthError };

export type SignUpResult = { ok: true; data: { uid: UID } } | { ok: false; error: AuthError };

/* ==================== CONSTANTS ==================== */

export const DEFAULT_KUDOS = 500 as const;
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '👏'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
