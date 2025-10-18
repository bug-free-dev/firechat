import { FireProfile } from '../types';

/**
 * Normalize a FireProfile object.
 * Ensures all expected fields exist (undefined if missing) but does NOT set defaults.
 * Safe, shallow copy, keeps efficiency.
 */

export function normalizeProfile(profile: Partial<FireProfile>): FireProfile {
	return {
		uid: profile.uid!,
		displayName: profile.displayName!,
		usernamey: profile.usernamey!,
		identifierKey: profile.identifierKey!,
		mood: profile.mood ?? undefined,
		quirks: profile.quirks ?? undefined,
		tags: profile.tags ?? undefined,
		status: profile.status ?? undefined,
		about: profile.about ?? undefined,
		avatarUrl: profile.avatarUrl ?? undefined,
		onboarded: profile.onboarded!,
		isBanned: profile.isBanned!,
		kudos: profile.kudos!,
		kudosGiven: profile.kudosGiven ?? 0,
		kudosReceived: profile.kudosReceived ?? 0,
		createdAt: profile.createdAt ?? undefined,
		lastSeen: profile.lastSeen ?? undefined,
		meta: profile.meta ?? {},
	};
}
