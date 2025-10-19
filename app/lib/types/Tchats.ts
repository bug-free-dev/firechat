import type { FireTime } from '@/app/lib/utils/time';

import type { ID, UID } from './Tuser';

/* <------- ATTACHMENT TYPES -------> */

/**
 * Supported attachment types
 */
export type AttachmentType = 'image' | 'video' | 'file';

/**
 * Message attachment structure
 */
export interface MessageAttachment {
	readonly id: ID;
	readonly type: AttachmentType;
	readonly url: string;
	readonly filename?: string;
	readonly size?: number;
	readonly mimeType?: string;
	readonly thumbnail?: string;
}

/* <------- CORE MESSAGE TYPES -------> */

/**
 * Message content type
 */
export type MessageContentType = 'markdown';

/**
 * Message status
 */
export type MessageStatus = 'sent' | 'delivered' | 'read';

/**
 * Client-side chat message structure
 */
export interface ChatMessage {
	readonly id?: ID;
	readonly roomId: string;
	readonly sessionId?: string;
	readonly sender: UID;
	readonly type: MessageContentType;
	readonly text: string;
	readonly replyTo?: ID;
	readonly reactions?: Readonly<Record<string, readonly UID[]>>;
	readonly attachments?: readonly MessageAttachment[];
	readonly extras?: Readonly<Record<string, unknown>>;
	readonly status?: MessageStatus;
	readonly createdAt?: FireTime;
}

/**
 * RTDB message structure (matches Firebase schema)
 */
export interface RTDBMessage {
	readonly id: ID;
	readonly roomId: string;
	readonly sessionId: string;
	readonly sender: UID;
	readonly type: MessageContentType;
	readonly text: string;
	readonly replyTo?: ID;
	readonly reactions: Record<string, string[]>;
	readonly attachments?: MessageAttachment[];
	readonly extras?: Record<string, unknown>;
	readonly status: MessageStatus;
	readonly createdAt: string;
}

/* <------- INBOX TYPES -------> */

export interface InboxInviteItem {
	readonly type: 'invite';
	readonly from: UID;
	readonly sessionId: string;
	readonly message: string;
	readonly createdAt: FireTime;
	readonly read: boolean;
}

export interface InboxThread {
	readonly id: ID;
	readonly participants: readonly UID[];
	readonly lastMessage?: {
		readonly text: string;
		readonly sender: UID;
		readonly timestamp: FireTime;
	};
	readonly unreadCount?: number;
	readonly raw?: InboxInviteItem;
}

/* <------- VALIDATION CONSTANTS -------> */

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;
export const MAX_MESSAGE_TEXT_LENGTH = 10000;
