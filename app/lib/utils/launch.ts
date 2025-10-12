'use server';

import { FieldValue } from 'firebase-admin/firestore';

import { adminDb } from '../firebase/FireAdmin';
import { DEFAULT_KUDOS } from '../types';
import { hashIdentifierKeyAsync } from './hashy';

type LaunchResult = { success: true; userRefPath: string } | { success: false; reason: string };

/**
 * Launch a user profile - handles hashing, timestamps, and initial kudos
 */
export async function launchUserProfile(
	uid: string,
	payload: {
		displayName: string;
		usernamey: string;
		identifierKey: string;
		mood?: string | null;
		quirks?: string[];
		tags?: string[];
		status?: string;
		about?: string;
		avatarUrl?: string | null;
	}
): Promise<LaunchResult> {
	if (!uid) return { success: false, reason: 'NO_AUTH' };

	try {
		const hashedKey = await hashIdentifierKeyAsync(payload.identifierKey);

		const userRef = adminDb.collection('users').doc(uid);
		const kudosRef = adminDb.collection('kudos').doc();

		await adminDb.runTransaction(async (tx) => {
			const snap = await tx.get(userRef);
			const isNew = !snap.exists;

			// Build profile object (exclude createdAt / lastSeen)
			const profileData: Record<string, unknown> = {
				uid,
				displayName: payload.displayName,
				usernamey: payload.usernamey,
				identifierKey: hashedKey,
				mood: payload.mood ?? null,
				quirks: payload.quirks ?? [],
				tags: payload.tags ?? [],
				status: payload.status ?? '',
				about: payload.about ?? '',
				avatarUrl: payload.avatarUrl ?? null,
				onboarded: true,
				isBanned: false,
				kudos: DEFAULT_KUDOS,
				kudosGiven: 0,
				kudosReceived: 0,
				meta: {},
			};

			// Merge the main profile
			tx.set(userRef, profileData, { merge: true });

			// Set createdAt if new user
			if (isNew) {
				tx.update(userRef, { createdAt: FieldValue.serverTimestamp() });

				// Initial kudos transaction
				tx.set(kudosRef, {
					from: 'SYSTEM',
					to: uid,
					amount: DEFAULT_KUDOS,
					type: 'system',
					note: 'Initial onboarding reward',
					createdAt: FieldValue.serverTimestamp(),
				});
			}

			tx.update(userRef, { lastSeen: FieldValue.serverTimestamp() });
		});

		return { success: true, userRefPath: `users/${uid}` };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown_error';
		return { success: false, reason: `WRITE_FAILED: ${message}` };
	}
}
