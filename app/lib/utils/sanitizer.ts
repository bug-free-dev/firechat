import { FireProfile } from '../types';

/**
 * Normalize a FireProfile object.
 * Ensures all expected fields exist (undefined if missing) but does NOT set defaults.
 * Safe, shallow copy, keeps efficiency.
 */

export function normalizeProfile(profile: Partial<FireProfile>): FireProfile {
	return {
		uid: profile.uid! as string,
		displayName: profile.displayName! as string,
		usernamey: profile.usernamey! as string,
		identifierKey: profile.identifierKey! as string,
		mood: profile.mood ?? undefined,
		quirks: profile.quirks ?? undefined,
		tags: profile.tags ?? undefined,
		status: profile.status ?? undefined,
		about: profile.about ?? undefined,
		avatarUrl: profile.avatarUrl ?? undefined,
		onboarded: profile.onboarded! as boolean,
		isBanned: profile.isBanned! as boolean,
		kudos: profile.kudos! as number,
		kudosGiven: profile.kudosGiven ?? 0,
		kudosReceived: profile.kudosReceived ?? 0,
		createdAt: profile.createdAt ?? undefined,
		lastSeen: profile.lastSeen ?? undefined,
		meta: profile.meta ?? {},
	};
}
