import type { DataSnapshot } from 'firebase/database';

import type { ChatMessage, FireCachedUser } from '@/app/lib/types';

/* ==================== RESULT TYPES ==================== */

export type ResultOk<T> = { ok: true; data: T };
export type ResultErr = {
	ok: false;
	error: string;
	reason?: string;
};
export type ServerResult<T> = ResultOk<T> | ResultErr;

/* ==================== SERVICE INTERFACES ==================== */

export interface SendMessagePayload {
	sessionId: string;
	senderUid: string;
	text: string;
	type?: ChatMessage['type'];
	replyTo?: string;
	extras?: Record<string, unknown>;
}

export interface GetMessagesParams {
	sessionId: string;
	limit?: number;
	before?: string;
}

export interface ReactionParams {
	messageId: string;
	sessionId: string;
	userId: string;
	emoji: string;
}

export interface DeleteMessageParams {
	messageId: string;
	sessionId: string;
	callerUid: string;
}

export interface MessagesServices {
	sendMessage: (payload: SendMessagePayload) => Promise<ServerResult<ChatMessage>>;
	getMessages: (params: GetMessagesParams) => Promise<ServerResult<ChatMessage[]>>;
	addReaction: (params: ReactionParams) => Promise<ServerResult<null>>;
	removeReaction: (params: ReactionParams) => Promise<ServerResult<null>>;
	deleteMessage: (params: DeleteMessageParams) => Promise<ServerResult<null>>;
}

/* ==================== HOOK OPTIONS ==================== */

export interface TypingProfile {
	uid: string;
	displayName?: string;
	avatarUrl?: string | null;
}

export interface UseMessagesOptions {
	sessionId: string;
	userUid: string;
	services: MessagesServices;
	options?: {
		initialLimit?: number;
		liveLimit?: number;
		maxMessagesInMemory?: number;
		typingProfile?: TypingProfile;
		typingDebounceMs?: number;
	};
}

/* ==================== HOOK RETURN TYPE ==================== */

export interface UseMessagesReturn {
	messages: ChatMessage[];
	sending: boolean;
	inFlightCount: number;
	typingUsers: FireCachedUser[];
	setTyping: (isTyping: boolean) => void;
	sendMessage: (
		text: string,
		replyTo?: string,
		extras?: Record<string, unknown>
	) => Promise<ServerResult<ChatMessage>>;
	fetchOlder: (beforeIso?: string, limit?: number) => Promise<ServerResult<ChatMessage[]>>;
	addReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	removeReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	deleteMessage: (messageId: string) => Promise<ServerResult<null>>;
	clear: () => void;
}

/* ==================== RTDB PAYLOAD TYPES ==================== */

interface FireTime {
	seconds?: number;
	nanoseconds?: number;
	_seconds?: number;
	_nanoseconds?: number;
}

export interface RTDBMessagePayload {
	roomId?: string;
	sessionId?: string;
	sender?: string;
	type?: string;
	text?: string;
	replyTo?: string;
	reactions?: Record<string, string[]>;
	extras?: Record<string, unknown>;
	status?: string;
	createdAt?: FireTime | number | string;
	updatedAt?: FireTime | number | string;
}

export interface RTDBTypingPayload {
	uid?: string;
	usernamey?: string;
	displayName?: string;
	avatarUrl?: string | null;
	kudos?: number;
	mood?: string;
	createdAt?: FireTime | number | string;
	startedAt?: FireTime | number | string;
	meta?: Record<string, unknown>;
}

/* ==================== LISTENER TYPES ==================== */

export type SnapshotCallback = (snap: DataSnapshot) => void;

export interface RTDBListeners {
	added?: SnapshotCallback;
	changed?: SnapshotCallback;
	removed?: SnapshotCallback;
	typingAdded?: SnapshotCallback;
	typingChanged?: SnapshotCallback;
	typingRemoved?: SnapshotCallback;
}
