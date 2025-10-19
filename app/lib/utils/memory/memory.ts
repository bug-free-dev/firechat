'use server';

import { adminDb } from '@/app/lib/firebase/FireAdmin';
import type { FireCachedUser, FireProfile } from '@/app/lib/types';

import { create } from '../time';
import { CONFIG, FrequentUserCache, UserCache, ValidationResult } from './config';
import { cloneSerializableUser, createCachedUser, isValidUser } from './helpers';

let cache: UserCache = {
	users: new Map(),
	byUid: new Map(),
	identifiers: new Set(),
	timestamp: 0,
};

let loadAllUsersInFlight: Promise<void> | null = null;

const perUserFreqCache = new Map<string, FrequentUserCache>();
const perUserFreqInFlight = new Map<string, Promise<FireCachedUser[]>>();

/* <------- Core Loader -------> */

async function loadAllUsers(): Promise<void> {
	if (loadAllUsersInFlight) return loadAllUsersInFlight;

	loadAllUsersInFlight = (async () => {
		try {
			const snapshot = await adminDb
				.collection('users')
				.where('isBanned', '==', false)
				.limit(CONFIG.MAX_USERS_QUERY)
				.get();

			const newUsers = new Map<string, FireCachedUser>();
			const newByUid = new Map<string, FireCachedUser>();
			const newIdentifiers = new Set<string>();

			snapshot.forEach((doc) => {
				const cached = createCachedUser(doc.data() as Partial<FireProfile>, doc.id);
				if (!cached) return;

				newUsers.set(cached.usernamey.toLowerCase(), cached);
				newByUid.set(cached.uid, cached);

				const identifier = cached.meta?.identifierKey;
				if (identifier && typeof identifier === 'string') {
					newIdentifiers.add(identifier.trim());
				}
			});

			cache = Object.freeze({
				users: newUsers,
				byUid: newByUid,
				identifiers: newIdentifiers,
				timestamp: create.nowMs(),
			});
		} finally {
			loadAllUsersInFlight = null;
		}
	})();

	return loadAllUsersInFlight;
}

/* <------- Cache Management -------> */

async function ensureFresh(): Promise<void> {
	const age = create.nowMs() - cache.timestamp;
	const hasMinimumUsers = cache.users.size >= CONFIG.MIN_USERS_THRESHOLD;
	const isStale = !hasMinimumUsers || age > CONFIG.CACHE_TTL;

	if (isStale) await loadAllUsers();
}

/* <------- Granular Cache Invalidation -------> */

/**
 * Remove user from cache
 */
function removeUserFromCache(uid: string): void {
	const oldUser = cache.byUid.get(uid);
	if (!oldUser) return;

	const newUsers = new Map(cache.users);
	const newByUid = new Map(cache.byUid);
	const newIdentifiers = new Set(cache.identifiers);

	newUsers.delete(oldUser.usernamey.toLowerCase());
	newByUid.delete(uid);

	const oldIdentifier = oldUser.meta?.identifierKey;
	if (oldIdentifier && typeof oldIdentifier === 'string') {
		newIdentifiers.delete(oldIdentifier.trim());
	}

	cache = Object.freeze({
		users: newUsers,
		byUid: newByUid,
		identifiers: newIdentifiers,
		timestamp: create.nowMs(),
	});
}

/**
 * Update user in cache
 */
function updateUserInCache(updated: FireCachedUser): void {
	const oldUser = cache.byUid.get(updated.uid);

	const newUsers = new Map(cache.users);
	const newByUid = new Map(cache.byUid);
	const newIdentifiers = new Set(cache.identifiers);

	if (oldUser) {
		if (oldUser.usernamey !== updated.usernamey) {
			newUsers.delete(oldUser.usernamey.toLowerCase());
		}

		const oldIdentifier = oldUser.meta?.identifierKey;
		if (oldIdentifier && typeof oldIdentifier === 'string') {
			newIdentifiers.delete(oldIdentifier.trim());
		}
	}

	newUsers.set(updated.usernamey.toLowerCase(), updated);
	newByUid.set(updated.uid, updated);

	const newIdentifier = updated.meta?.identifierKey;
	if (newIdentifier && typeof newIdentifier === 'string') {
		newIdentifiers.add(newIdentifier.trim());
	}

	cache = Object.freeze({
		users: newUsers,
		byUid: newByUid,
		identifiers: newIdentifiers,
		timestamp: create.nowMs(),
	});
}

/**
 * Invalidate a single user - O(1) operation
 */
export async function invalidateUser(uid: string): Promise<void> {
	if (!uid) return;

	try {
		const doc = await adminDb.collection('users').doc(uid).get();

		if (!doc.exists) {
			removeUserFromCache(uid);
			return;
		}

		const data = doc.data() as Partial<FireProfile>;

		if (data.isBanned) {
			removeUserFromCache(uid);
			return;
		}

		const updated = createCachedUser(data, doc.id);
		if (!updated) return;

		updateUserInCache(updated);

		perUserFreqCache.clear();
	} catch {
		// Silent fail - cache will self-heal on next ensureFresh()
	}
}

/**
 * Bulk invalidate multiple users
 */
export async function invalidateUsers(uids: string[]): Promise<void> {
	if (!uids.length) return;
	await Promise.allSettled(uids.map((uid) => invalidateUser(uid)));
}

/**
 * Force full cache reload
 */
export async function reloadCache(): Promise<void> {
	loadAllUsersInFlight = null;
	await loadAllUsers();
	perUserFreqCache.clear();
}

/* <------- Auto-Invalidation Wrapper -------> */

/**
 * Execute operation and auto-invalidate cache
 */
export async function withInvalidation<T>(uid: string, operation: () => Promise<T>): Promise<T> {
	const result = await operation();
	await invalidateUser(uid);
	return result;
}

/* <------- Username & Identifier Validation -------> */

/**
 * Check if username is available (case-insensitive)
 */
export async function isUsernameAvailable(usernamey: string): Promise<ValidationResult> {
	const trimmed = usernamey?.trim();
	if (!trimmed) {
		return { available: false, reason: 'Username cannot be empty' };
	}

	if (trimmed.length < 3) {
		return { available: false, reason: 'Username must be at least 3 characters' };
	}

	if (trimmed.length > 20) {
		return { available: false, reason: 'Username cannot exceed 20 characters' };
	}

	if (!/^[a-z0-9_]+$/.test(trimmed.toLowerCase())) {
		return {
			available: false,
			reason: 'Username can only contain letters, numbers, and underscores',
		};
	}

	await ensureFresh();

	const exists = cache.users.has(trimmed.toLowerCase());
	return {
		available: !exists,
		reason: exists ? 'Username is already taken' : undefined,
	};
}

/**
 * Check if identifier key is available
 */
export async function isIdentifierAvailable(identifierKey: string): Promise<ValidationResult> {
	const trimmed = identifierKey?.trim();
	if (!trimmed) {
		return { available: false, reason: 'Identifier cannot be empty' };
	}

	if (trimmed.length < 8) {
		return { available: false, reason: 'Identifier must be at least 8 characters' };
	}

	await ensureFresh();

	const exists = cache.identifiers.has(trimmed);
	return {
		available: !exists,
		reason: exists ? 'Identifier is already in use' : undefined,
	};
}

/* <------- Public API -------> */

export async function getAllCachedUsers(): Promise<FireCachedUser[]> {
	await ensureFresh();
	return Array.from(cache.users.values(), cloneSerializableUser);
}

export async function searchUsersByUsername(query: string): Promise<FireCachedUser[]> {
	await ensureFresh();

	const normalizedQuery = (query ?? '').trim().toLowerCase();

	if (!normalizedQuery) {
		return Array.from(cache.users.values(), cloneSerializableUser);
	}

	const results: FireCachedUser[] = [];

	for (const user of cache.users.values()) {
		if (!isValidUser(user)) continue;

		if (
			user.usernamey.toLowerCase().includes(normalizedQuery) ||
			user.displayName.toLowerCase().includes(normalizedQuery)
		) {
			results.push(cloneSerializableUser(user));
		}
	}

	return results;
}

export async function getUserByUsername(usernamey: string): Promise<FireCachedUser | null> {
	if (!usernamey) return null;

	await ensureFresh();
	const user = cache.users.get(usernamey.toLowerCase()) ?? null;
	return user ? cloneSerializableUser(user) : null;
}

export async function getUserByUid(uid: string): Promise<FireCachedUser | null> {
	if (!uid) return null;

	await ensureFresh();
	const user = cache.byUid.get(uid) ?? null;
	return user ? cloneSerializableUser(user) : null;
}

/* <------- Frequent Users -------> */

async function aggregateInteractions(forUid: string, limit: number): Promise<string[]> {
	const interactionCount = new Map<string, number>();

	const snapshot = await adminDb
		.collection('kudos')
		.where('from', '==', forUid)
		.orderBy('createdAt', 'desc')
		.limit(CONFIG.KUDOS_QUERY_LIMIT)
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

function buildFrequentUsersList(
	topUids: string[],
	forUid: string,
	limit: number
): FireCachedUser[] {
	const results: FireCachedUser[] = [];
	const usedUids = new Set<string>([forUid]);

	for (const uid of topUids) {
		const user = cache.byUid.get(uid);
		if (isValidUser(user) && !usedUids.has(uid)) {
			results.push(cloneSerializableUser(user));
			usedUids.add(uid);
		}
	}

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

export async function getFrequentUsers(forUid: string, limit = 10): Promise<FireCachedUser[]> {
	if (!forUid) return [];

	const now = create.nowMs();
	const cached = perUserFreqCache.get(forUid);
	if (cached && now - cached.ts < CONFIG.FREQ_CACHE_TTL) {
		return Array.from(cached.users).slice(0, limit);
	}

	const inFlight = perUserFreqInFlight.get(forUid);
	if (inFlight) return inFlight;

	const promise = (async (): Promise<FireCachedUser[]> => {
		await ensureFresh();

		try {
			const topUids = await aggregateInteractions(forUid, limit);
			const results = buildFrequentUsersList(topUids, forUid, limit);

			perUserFreqCache.set(forUid, Object.freeze({ ts: create.nowMs(), users: results }));
			return results;
		} catch (error: unknown) {
			const err = error as { code?: number | string };

			if (err?.code === 9) {
				try {
					const topUids = await aggregateInteractionsFallback(forUid, limit);
					const results = buildFrequentUsersList(topUids, forUid, limit);

					perUserFreqCache.set(forUid, Object.freeze({ ts: create.nowMs(), users: results }));
					return results;
				} catch {
					// Fallback to generic users
				}
			}

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
