import { FireCachedUser } from '../../types';

export interface UserCache {
	readonly users: Map<string, FireCachedUser>;
	readonly byUid: Map<string, FireCachedUser>;
	readonly identifiers: Set<string>;
	readonly timestamp: number;
}

export interface FrequentUserCache {
	readonly ts: number;
	readonly users: readonly FireCachedUser[];
}

export interface ValidationResult {
	readonly available: boolean;
	readonly reason?: string;
}

export const CONFIG = {
	CACHE_TTL: 5 * 60 * 1000, // 5 minutes
	FREQ_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
	MAX_USERS_QUERY: 2000,
	KUDOS_QUERY_LIMIT: 200,
	KUDOS_FALLBACK_LIMIT: 500,
	MIN_USERS_THRESHOLD: 10,
} as const;
