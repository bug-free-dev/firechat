import type { FireTime } from '@/app/lib/utils/time';

import type { ID, UID } from './Tuser';

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
