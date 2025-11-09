import type { FireTime } from '@/app/lib/utils/time';

/**
 * Canonical user ID type.
 */
export type UID = string;

/**
 * Canonical generic ID type.
 */
export type ID = string;

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
export interface CachedUser {
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
	byUsername: Record<string, CachedUser>;
	byUid: Record<string, CachedUser>;
	timestamp: number;
	meta?: Record<string, unknown>;
}
