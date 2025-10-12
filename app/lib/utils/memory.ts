'use server';

import type { FireCachedUser, FireProfile } from '@/app/lib/types';

import { adminDb } from '@/app/lib/firebase/FireAdmin';
import { create, type FireTime, toISO } from './time';

/* ==================== Configuration ==================== */

const CONFIG = {
	CACHE_TTL: 10 * 60 * 1000, // 10 minutes - memory stays fresh
	FREQ_CACHE_TTL: 2 * 60 * 1000, // 2 minutes - lightning quick
	MAX_USERS_QUERY: 2000, // upper bound for safety
	KUDOS_QUERY_LIMIT: 200, // optimal fetch size
	KUDOS_FALLBACK_LIMIT: 500, // fallback when index missing
} as const;

/* ==================== Types ==================== */

interface UserCache {
	readonly users: Map<string, FireCachedUser>;
	readonly byUid: Map<string, FireCachedUser>;
	readonly timestamp: number;
}

interface FrequentUserCache {
	readonly ts: number;
	readonly users: readonly FireCachedUser[];
}

/* ==================== In-Memory State (Singleton) ==================== */

let cache: UserCache = {
	users: new Map(),
	byUid: new Map(),
	timestamp: 0,
};

// Request deduplication
let loadAllUsersInFlight: Promise<void> | null = null;

// Per-user frequent cache with TTL
const perUserFreqCache = new Map<string, FrequentUserCache>();
const perUserFreqInFlight = new Map<string, Promise<FireCachedUser[]>>();

/* ==================== Fast Helper Functions ==================== */

/**
 * Converts FireTime to ISO string - no overhead
 */
const toISOString = (value: FireTime): string | undefined => toISO(value) || undefined;

/**
 * Fast metadata extraction - collects profile fields into meta
 */
function extractUserMeta(data: Partial<FireProfile>): Record<string, unknown> | undefined {
	const meta: Record<string, unknown> = {};

	// Collect profile enrichment fields
	if (data.mood) meta.mood = data.mood;
	if (data.status) meta.status = data.status;
	if (data.about) meta.about = data.about;
	if (data.tags?.length) meta.tags = data.tags;
	if (data.quirks?.length) meta.quirks = data.quirks;

	// Merge existing meta if present
	if (data.meta && typeof data.meta === 'object' && !Array.isArray(data.meta)) {
		Object.assign(meta, data.meta);
	}

	return Object.keys(meta).length > 0 ? meta : undefined;
}

/**
 * Creates cached user - fast path, zero allocations when possible
 */
function createCachedUser(data: Partial<FireProfile>, docId: string): FireCachedUser | null {
	const uid = String(data.uid ?? docId);
	const usernamey =
		typeof data.usernamey === 'string'
			? data.usernamey
			: typeof data.displayName === 'string'
				? data.displayName.toLowerCase()
				: undefined;

	if (!uid || !usernamey) return null;

	return {
		uid,
		usernamey: String(usernamey),
		displayName: String(data.displayName ?? usernamey),
		avatarUrl: data.avatarUrl ?? null,
		kudos: Number.isFinite(Number(data.kudos ?? 0)) ? Number(data.kudos ?? 0) : 0,
		isBanned: Boolean(data.isBanned),
		createdAt: toISOString(data.createdAt as FireTime) ?? '',
		lastSeen: toISOString(data.lastSeen as FireTime) ?? '',
		meta: extractUserMeta(data),
	};
}

/**
 * Shallow clone for serialization - minimal overhead
 */
const cloneSerializableUser = (user: FireCachedUser): FireCachedUser => ({
	uid: user.uid,
	usernamey: user.usernamey,
	displayName: user.displayName,
	avatarUrl: user.avatarUrl ?? null,
	kudos: Number(user.kudos ?? 0),
	isBanned: Boolean(user.isBanned),
	createdAt: user.createdAt,
	lastSeen: user.lastSeen,
	meta: user.meta ? { ...user.meta } : undefined,
});

/* ==================== Core Loader (Bulletproof) ==================== */

/**
 * Loads all users into memory - deduped, atomic, bulletproof
 */
async function loadAllUsers(): Promise<void> {
	// Deduplicate concurrent calls
	if (loadAllUsersInFlight) return loadAllUsersInFlight;

	loadAllUsersInFlight = (async () => {
		try {
			const snapshot = await adminDb
				.collection('users')
				.where('isBanned', '==', false)
				.limit(CONFIG.MAX_USERS_QUERY)
				.get();

			// Pre-allocate maps for performance
			const newUsers = new Map<string, FireCachedUser>();
			const newByUid = new Map<string, FireCachedUser>();

			// Single pass - O(n) time complexity
			snapshot.forEach((doc) => {
				const cached = createCachedUser(doc.data() as Partial<FireProfile>, doc.id);
				if (!cached) return;

				newUsers.set(cached.usernamey.toLowerCase(), cached);
				newByUid.set(cached.uid, cached);
			});

			// Atomic cache replacement
			cache = Object.freeze({
				users: newUsers,
				byUid: newByUid,
				timestamp: create.nowMs(),
			});
		} catch (error) {
			throw error; // Re-throw for caller handling
		} finally {
			loadAllUsersInFlight = null;
		}
	})();

	return loadAllUsersInFlight;
}

/* ==================== Cache Management ==================== */

/**
 * Ensures cache freshness - reloads only when stale
 */
async function ensureFresh(): Promise<void> {
	const age = create.nowMs() - cache.timestamp;
	const isStale = cache.users.size === 0 || age > CONFIG.CACHE_TTL;

	if (isStale) await loadAllUsers();
}

/**
 * Inline validation - zero cost abstraction
 */
const isValidUser = (user: FireCachedUser | undefined): user is FireCachedUser =>
	!!user && !user.isBanned;

/* ==================== Public API (Lightning Fast) ==================== */

/**
 * Get all users - O(n) where n = cache size
 */
export async function getAllCachedUsers(): Promise<FireCachedUser[]> {
	await ensureFresh();
	return Array.from(cache.users.values(), cloneSerializableUser);
}

/**
 * Search users - O(n) linear scan, optimized for small n
 */
export async function searchUsersByUsername(query: string): Promise<FireCachedUser[]> {
	await ensureFresh();

	const normalizedQuery = (query ?? '').trim().toLowerCase();

	// Fast path: return all if no query
	if (!normalizedQuery) {
		return Array.from(cache.users.values(), cloneSerializableUser);
	}

	// Optimized search - single pass with early filtering
	const results: FireCachedUser[] = [];

	for (const user of cache.users.values()) {
		if (!isValidUser(user)) continue;

		// Fast string matching
		if (
			user.usernamey.toLowerCase().includes(normalizedQuery) ||
			user.displayName.toLowerCase().includes(normalizedQuery)
		) {
			results.push(cloneSerializableUser(user));
		}
	}

	return results;
}

/**
 * Get by username - O(1) hash lookup
 */
export async function getUserByUsername(usernamey: string): Promise<FireCachedUser | null> {
	if (!usernamey) return null;

	await ensureFresh();
	const user = cache.users.get(usernamey.toLowerCase()) ?? null;
	return user ? cloneSerializableUser(user) : null;
}

/**
 * Get by UID - O(1) hash lookup
 */
export async function getUserByUid(uid: string): Promise<FireCachedUser | null> {
	if (!uid) return null;

	await ensureFresh();
	const user = cache.byUid.get(uid) ?? null;
	return user ? cloneSerializableUser(user) : null;
}

/* ==================== Frequent Users (Intelligent & Fast) ==================== */

/**
 * Aggregates interactions - optimized for speed
 */
async function aggregateInteractions(forUid: string, limit: number): Promise<string[]> {
	const interactionCount = new Map<string, number>();

	const snapshot = await adminDb
		.collection('kudos')
		.where('from', '==', forUid)
		.orderBy('createdAt', 'desc')
		.limit(CONFIG.KUDOS_QUERY_LIMIT)
		.get();

	// Single pass aggregation
	snapshot.forEach((doc) => {
		const data = doc.data() as { to?: string };
		if (!data?.to) return;
		interactionCount.set(data.to, (interactionCount.get(data.to) || 0) + 1);
	});

	// Top-K selection with sort
	return Array.from(interactionCount.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([uid]) => uid);
}

/**
 * Fallback aggregation - no ordering constraint
 */
async function aggregateInteractionsFallback(forUid: string, limit: number): Promise<string[]> {
	const interactionCount = new Map<string, number>();

	const snapshot = await adminDb
		.collection('kudos')
		.where('from', '==', forUid)
		.limit(CONFIG.KUDOS_FALLBACK_LIMIT)
		.get();

	snapshot.forEach((doc) => {
		const data = doc.data() as { to?: string };
		if (!data?.to) return;
		interactionCount.set(data.to, (interactionCount.get(data.to) || 0) + 1);
	});

	return Array.from(interactionCount.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([uid]) => uid);
}

/**
 * Builds result list with intelligent backfilling
 */
function buildFrequentUsersList(
	topUids: string[],
	forUid: string,
	limit: number
): FireCachedUser[] {
	const results: FireCachedUser[] = [];
	const usedUids = new Set<string>([forUid]);

	// Add frequent users first
	for (const uid of topUids) {
		const user = cache.byUid.get(uid);
		if (isValidUser(user) && !usedUids.has(uid)) {
			results.push(cloneSerializableUser(user));
			usedUids.add(uid);
		}
	}

	// Backfill with other users if needed
	if (results.length < limit) {
		for (const user of cache.byUid.values()) {
			if (results.length >= limit) break;
			if (!usedUids.has(user.uid) && isValidUser(user)) {
				results.push(cloneSerializableUser(user));
				usedUids.add(user.uid);
			}
		}
	}

	return results;
}

/**
 * Get frequent users - cached, deduped, bulletproof
 */
export async function getFrequentUsers(forUid: string, limit = 10): Promise<FireCachedUser[]> {
	if (!forUid) return [];

	// Check cache first - O(1)
	const now = create.nowMs();
	const cached = perUserFreqCache.get(forUid);
	if (cached && now - cached.ts < CONFIG.FREQ_CACHE_TTL) {
		return Array.from(cached.users).slice(0, limit);
	}

	// Deduplicate in-flight requests
	const inFlight = perUserFreqInFlight.get(forUid);
	if (inFlight) return inFlight;

	// Execute query with fallback strategy
	const promise = (async (): Promise<FireCachedUser[]> => {
		await ensureFresh();

		try {
			const topUids = await aggregateInteractions(forUid, limit);
			const results = buildFrequentUsersList(topUids, forUid, limit);

			perUserFreqCache.set(forUid, Object.freeze({ ts: create.nowMs(), users: results }));
			return results;
		} catch (error: unknown) {
			const err = error as { code?: number | string; details?: string; message?: string };

			// Graceful degradation on missing index
			if (err?.code === 9) {
				try {
					const topUids = await aggregateInteractionsFallback(forUid, limit);
					const results = buildFrequentUsersList(topUids, forUid, limit);

					perUserFreqCache.set(forUid, Object.freeze({ ts: create.nowMs(), users: results }));
					return results;
				} catch {
					/** Ignore */
				}
			}

			// Ultimate safety net - return random users
			const fallbackUsers = Array.from(cache.byUid.values())
				.filter((u) => isValidUser(u) && u.uid !== forUid)
				.slice(0, limit)
				.map(cloneSerializableUser);

			perUserFreqCache.set(forUid, Object.freeze({ ts: create.nowMs(), users: fallbackUsers }));
			return fallbackUsers;
		} finally {
			perUserFreqInFlight.delete(forUid);
		}
	})();

	perUserFreqInFlight.set(forUid, promise);
	return promise;
}
