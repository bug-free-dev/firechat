import type { FireTime } from '@/app/lib/utils/time';

import type { ID, UID } from './Tuser';

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
