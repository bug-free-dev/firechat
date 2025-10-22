import type { FireTime } from '@/app/lib/utils/time';

import type { ID, UID } from '.';

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
	readonly id: ID;
	readonly roomId: string;
	readonly sessionId?: string;
	readonly sender: UID;
	readonly type: MessageContentType;
	readonly text: string;
	readonly replyTo?: ID;
	readonly reactions?: Record<string, UID[]>;
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
