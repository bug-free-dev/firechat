'use server';

import { adminDb } from '../firebase/FireAdmin';

const usernameCache: Set<string> = new Set();
const identifierKeyCache: Set<string> = new Set();

let cachePromise: Promise<void> | null = null;

/**
 * Lazy-load all usernames and identifier keys once per server instance.
 */
async function ensureLoaded(): Promise<void> {
	if (!cachePromise) {
		cachePromise = (async () => {
			const snapshot = await adminDb.collection('users').get();
			snapshot.forEach((doc) => {
				const data = doc.data();
				if (data.usernamey) usernameCache.add(data.usernamey.trim());
				if (data.identifierKey) identifierKeyCache.add(data.identifierKey.trim());
			});
		})();
	}
	return cachePromise;
}

/**
 * Check if a username is unique.
 */
export async function checkUsernameUnique(usernamey: string): Promise<boolean> {
	const trimmed = usernamey?.trim();
	if (!trimmed) return false;

	await ensureLoaded();
	return !usernameCache.has(trimmed);
}

/**
 * Check if an identifier key is unique.
 */
export async function checkIdentifierKeyUnique(identifierKey: string): Promise<boolean> {
	const trimmed = identifierKey?.trim();
	if (!trimmed) return false;

	await ensureLoaded();
	return !identifierKeyCache.has(trimmed);
}
