/* <------- API PAYLOAD TYPES -------> */

import type { DataSnapshot } from 'firebase/database';

import { ChatMessage, FireCachedUser, ServerResult } from '@/app/lib/types';

/**
 * Payload for sending a message
 */
export interface SendMessagePayload {
	readonly sessionId: string;
	readonly senderUid: string;
	readonly text: string;
	readonly type?: ChatMessage['type'];
	readonly replyTo?: string;
	readonly extras?: Readonly<Record<string, unknown>>;
}

/**
 * Params for fetching messages
 */
export interface GetMessagesParams {
	readonly sessionId: string;
	readonly limit?: number;
	readonly before?: string;
}

/**
 * Params for reactions
 */
export interface ReactionParams {
	readonly messageId: string;
	readonly sessionId: string;
	readonly userId: string;
	readonly emoji: string;
}

/**
 * Params for deleting messages
 */
export interface DeleteMessageParams {
	readonly messageId: string;
	readonly sessionId: string;
	readonly callerUid: string;
}

/* <------- SERVICE INTERFACE -------> */

export interface MessagesServices {
	sendMessage: (payload: SendMessagePayload) => Promise<ServerResult<ChatMessage>>;
	getMessages: (params: GetMessagesParams) => Promise<ServerResult<ChatMessage[]>>;
	addReaction: (params: ReactionParams) => Promise<ServerResult<null>>;
	removeReaction: (params: ReactionParams) => Promise<ServerResult<null>>;
	deleteMessage: (params: DeleteMessageParams) => Promise<ServerResult<null>>;
}

/* <------- HOOK TYPES -------> */

export interface TypingProfile {
	readonly uid: string;
	readonly displayName?: string;
	readonly avatarUrl?: string | null;
}

export interface UseMessagesOptions {
	readonly sessionId: string;
	readonly userUid: string;
	readonly services: MessagesServices;
	readonly options?: {
		readonly initialLimit?: number;
		readonly liveLimit?: number;
		readonly maxMessagesInMemory?: number;
		readonly typingProfile?: TypingProfile;
		readonly typingDebounceMs?: number;
	};
}

export interface UseMessagesReturn {
	readonly messages: ChatMessage[];
	readonly sending: boolean;
	readonly inFlightCount: number;
	readonly typingUsers: FireCachedUser[];
	readonly setTyping: (isTyping: boolean) => void;
	readonly sendMessage: (text: string, replyTo?: string) => Promise<ServerResult<ChatMessage>>;
	readonly fetchOlder: (
		beforeIso?: string,
		limit?: number
	) => Promise<ServerResult<ChatMessage[]>>;
	readonly addReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	readonly removeReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	readonly deleteMessage: (messageId: string) => Promise<ServerResult<null>>;
	readonly clear: () => void;
}

/* <------- RTDB PAYLOAD TYPES -------> */

interface FireTimeObject {
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
	createdAt?: string | number | FireTimeObject;
}

export interface RTDBTypingPayload {
	uid?: string;
	usernamey?: string;
	displayName?: string;
	avatarUrl?: string | null;
	kudos?: number;
	mood?: string;
	createdAt?: string | number | FireTimeObject;
	startedAt?: string | number | FireTimeObject;
	meta?: Record<string, unknown>;
}

/* <------- LISTENER TYPES -------> */

export type SnapshotCallback = (snap: DataSnapshot) => void;
export interface RTDBListeners {
	added?: SnapshotCallback;
	changed?: SnapshotCallback;
	removed?: SnapshotCallback;
	typingAdded?: SnapshotCallback;
	typingChanged?: SnapshotCallback;
	typingRemoved?: SnapshotCallback;
}
