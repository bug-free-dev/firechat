'use server';

import { FieldValue } from 'firebase-admin/firestore';

import { adminAuth, adminDb } from '@/app/lib/firebase/FireAdmin';
import type { FireProfile } from '@/app/lib/types';
import { toISO } from '@/app/lib/utils/time';

/**
 * Fetch all user profiles
 */
export async function getAllUsers(): Promise<FireProfile[]> {
	try {
		const snap = await adminDb.collection('users').get();
		return snap.docs.map((doc) => doc.data() as FireProfile);
	} catch {
		return [];
	}
}

/**
 * Fetch a user profile by UID
 */
export async function getUserProfileFromUid(uid: string): Promise<FireProfile | null> {
	if (uid.length === 0) return null;

	try {
		const snap = await adminDb.collection('users').doc(uid).get();
		if (!snap.exists) return null;

		// Cast safely into FireProfile
		return snap.data() as FireProfile;
	} catch {
		return null;
	}
}

/**
 * Update user profile (partial fields only)
 */
export async function updateUserProfile(
	uid: string,
	updates: Partial<
		Pick<
			FireProfile,
			'displayName' | 'mood' | 'quirks' | 'tags' | 'status' | 'about' | 'avatarUrl'
		>
	>
): Promise<boolean> {
	if (uid.length === 0) return false;

	try {
		const userRef = adminDb.collection('users').doc(uid);
		await userRef.update({
			...updates,
			lastSeen: FieldValue.serverTimestamp(),
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Touch lastSeen (fast ping, safe to call often)
 */
export async function touchUserLastSeen(uid: string): Promise<void> {
	if (uid.length === 0) return;
	const userRef = adminDb.collection('users').doc(uid);
	try {
		await userRef.update({ lastSeen: FieldValue.serverTimestamp() });
	} catch {
		await userRef.set({ lastSeen: FieldValue.serverTimestamp() }, { merge: true });
	}
}

/**
 * Ban or unban a user
 */
export async function setUserBan(uid: string, isBanned: boolean): Promise<boolean> {
	if (uid.length === 0) return false;

	try {
		const userRef = adminDb.collection('users').doc(uid);
		await userRef.update({
			isBanned,
			lastSeen: FieldValue.serverTimestamp(),
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Fetch user profile from Firestore using ID token
 * @param idToken - Firebase ID token
 * @returns Partial FireProfile or null if not found/error
 */
export async function getMinimalProfileFromIdToken(
	idToken: string
): Promise<Partial<FireProfile> | null> {
	if (!idToken || typeof idToken !== 'string') {
		return null;
	}

	try {
		// Verify token and extract uid
		const decoded = await adminAuth.verifyIdToken(idToken);
		const { uid } = decoded;

		if (!uid || typeof uid !== 'string') {
			return null;
		}

		// Fetch user document
		const snap = await adminDb.collection('users').doc(uid).get();

		if (!snap.exists) {
			return null;
		}

		const data = snap.data() as Partial<FireProfile> | undefined;

		if (!data) {
			return null;
		}

		// Build partial profile with safe defaults
		const profile: Partial<FireProfile> = {
			uid: data.uid ?? uid,
		};

		// Required string fields with defaults
		if (data.displayName && typeof data.displayName === 'string') {
			profile.displayName = data.displayName.trim();
		}

		if (data.usernamey && typeof data.usernamey === 'string') {
			profile.usernamey = data.usernamey.trim();
		}

		if (data.identifierKey && typeof data.identifierKey === 'string') {
			profile.identifierKey = data.identifierKey;
		}

		// Optional string fields
		if ('mood' in data) {
			profile.mood = data.mood === null ? null : String(data.mood || '').trim() || null;
		}

		if ('status' in data && data.status) {
			profile.status = String(data.status).trim();
		}

		if ('about' in data && data.about) {
			profile.about = String(data.about).trim();
		}

		// FireAvatar URL
		if ('avatarUrl' in data) {
			profile.avatarUrl =
				data.avatarUrl === null ? null : String(data.avatarUrl || '').trim() || null;
		}

		// Array fields
		if (Array.isArray(data.quirks) && data.quirks.length > 0) {
			profile.quirks = data.quirks
				.filter((q) => typeof q === 'string')
				.map((q) => q.trim())
				.filter(Boolean);
		}

		if (Array.isArray(data.tags) && data.tags.length > 0) {
			profile.tags = data.tags
				.filter((t) => typeof t === 'string')
				.map((t) => t.trim())
				.filter(Boolean);
		}

		// Boolean fields
		if ('onboarded' in data) {
			profile.onboarded = Boolean(data.onboarded);
		}

		if ('isBanned' in data) {
			profile.isBanned = Boolean(data.isBanned);
		}

		// Number fields
		if ('kudos' in data) {
			const kudos = Number(data.kudos);
			profile.kudos = Number.isFinite(kudos) ? kudos : 0;
		}

		if ('kudosGiven' in data) {
			const given = Number(data.kudosGiven);
			profile.kudosGiven = Number.isFinite(given) ? given : undefined;
		}

		if ('kudosReceived' in data) {
			const received = Number(data.kudosReceived);
			profile.kudosReceived = Number.isFinite(received) ? received : undefined;
		}

		if ('createdAt' in data && data.createdAt) {
			profile.createdAt = toISO(data.createdAt);
		}

		if ('lastSeen' in data && data.lastSeen) {
			profile.lastSeen = toISO(data.lastSeen);
		}

		// Meta object (shallow copy if exists)
		if (data.meta && typeof data.meta === 'object' && !Array.isArray(data.meta)) {
			profile.meta = { ...data.meta };
		}

		return profile;
	} catch {
		return null;
	}
}
/**
 * Check if user exists and is not banned
 * @param uid - Firebase UID
 * @returns true if user exists and not banned
 */
export async function isUserActive(uid: string): Promise<boolean> {
	if (uid.length === 0 || typeof uid !== 'string') return false;

	try {
		const snap = await adminDb.collection('users').doc(uid).get();
		if (!snap.exists) return false;

		const data = snap.data() as Partial<FireProfile> | undefined;
		return !(data?.isBanned ?? false);
	} catch {
		return false;
	}
}

/**
 * Delete a user account atomically and reliably
 * @param uid - Firebase UID of the user to delete
 * @returns true if the account was deleted successfully, false otherwise
 */
export async function deleteAccount(uid: string): Promise<boolean> {
	if (uid.length === 0) return false;

	try {
		// Delete user document from Firestore
		const userRef = adminDb.collection('users').doc(uid);
		await userRef.delete();

		// Delete user from Firebase Authentication
		await adminAuth.deleteUser(uid);
		return true;
	} catch {
		return false;
	}
}
