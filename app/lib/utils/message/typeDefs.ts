import type { DataSnapshot } from 'firebase/database';

import type { CachedUser, ChatMessage, ServerResult } from '@/app/lib/types';

/* <------- API PAYLOAD TYPES -------> */

export interface SendMessagePayload {
	readonly sessionId: string;
	readonly senderUid: string;
	readonly text: string;
	readonly type?: ChatMessage['type'];
	readonly replyTo?: string;
	readonly extras?: Readonly<Record<string, unknown>>;
}

export interface GetMessagesParams {
	readonly sessionId: string;
	readonly limit?: number;
	readonly before?: string;
}

export interface ReactionParams {
	readonly messageId: string;
	readonly sessionId: string;
	readonly userId: string;
	readonly emoji: string;
}

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
		readonly autoFetchInitial?: boolean;
	};
}

export interface UseMessagesReturn {
	readonly messages: ChatMessage[];
	readonly messagesMap: Map<string, ChatMessage>;
	readonly sending: boolean;
	readonly isSorted: true;
	readonly typingUsers: CachedUser[];
	readonly isFetching: boolean;
	readonly hasMore: boolean;
	readonly setTyping: (isTyping: boolean) => void;
	readonly sendMessage: (
		text: string,
		replyTo?: string,
		extras?: Record<string, unknown>
	) => Promise<ServerResult<ChatMessage>>;
	readonly fetchOlder: (
		beforeIso?: string,
		limit?: number
	) => Promise<ServerResult<ChatMessage[]>>;
	readonly fetchInitial: () => Promise<ServerResult<ChatMessage[]>>;
	readonly addReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	readonly removeReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	readonly deleteMessage: (messageId: string) => Promise<ServerResult<null>>;
	readonly clear: () => void;
}

/* <------- INTERNAL HOOK TYPES -------> */

export interface UseMessageStoreParams {
	readonly sessionId: string;
	readonly userUid: string;
	readonly services: MessagesServices;
	readonly maxMessagesInMemory?: number;
}

export interface UseMessageStoreReturn {
	readonly messages: ChatMessage[];
	readonly messagesMap: Map<string, ChatMessage>;
	readonly isSorted: true;
	readonly sending: boolean;
	readonly upsertMessage: (msg: ChatMessage) => void;
	readonly removeMessage: (msgId: string) => void;
	readonly sendMessage: (
		text: string,
		replyTo?: string,
		extras?: Record<string, unknown>
	) => Promise<ServerResult<ChatMessage>>;
	readonly addReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	readonly removeReaction: (messageId: string, emoji: string) => Promise<ServerResult<null>>;
	readonly deleteMessage: (messageId: string) => Promise<ServerResult<null>>;
	readonly clear: () => void;
}

export interface UseMessageFetchParams {
	readonly sessionId: string;
	readonly services: MessagesServices;
	readonly initialLimit?: number;
	readonly onMessagesBatch: (messages: ChatMessage[]) => void;
}

export interface UseMessageFetchReturn {
	readonly fetchOlder: (
		beforeIso?: string,
		limit?: number
	) => Promise<ServerResult<ChatMessage[]>>;
	readonly fetchInitial: () => Promise<ServerResult<ChatMessage[]>>;
	readonly isFetching: boolean;
	readonly hasMore: boolean;
}

export interface UseMessageSyncParams {
	readonly sessionId: string;
	readonly userUid: string;
	readonly liveLimit: number;
	readonly typingProfile?: TypingProfile;
	readonly typingDebounceMs?: number;
	readonly onMessageUpsert: (msg: ChatMessage) => void;
	readonly onMessageRemove: (msgId: string) => void;
}

export interface UseMessageSyncReturn {
	readonly typingUsers: CachedUser[];
	readonly setTyping: (isTyping: boolean) => void;
	readonly cleanup: () => void;
}

/* <------- RTDB TYPES -------> */

export type SnapshotCallback = (snap: DataSnapshot) => void;

export interface RTDBListeners {
	added?: SnapshotCallback;
	changed?: SnapshotCallback;
	removed?: SnapshotCallback;
	typingAdded?: SnapshotCallback;
	typingChanged?: SnapshotCallback;
	typingRemoved?: SnapshotCallback;
}
