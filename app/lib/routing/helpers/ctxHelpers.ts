import { FireProfile } from '@/app/lib/types';
import { Memory } from '@/app/lib/utils/localStorage';
import { normalizeProfile } from '@/app/lib/utils/normalize';

export interface ProfileCache {
	profile: FireProfile;
	timestamp: number;
}

export const MAX_CACHE_SIZE = 50;
export const profileCache = new Map<string, ProfileCache>();

export const normalizeProfileMemoized = (() => {
	const cache = new WeakMap<Partial<FireProfile>, FireProfile>();
	return (data: Partial<FireProfile>): FireProfile => {
		const cached = cache.get(data);
		if (cached) return cached;
		const normalized = normalizeProfile(data);
		cache.set(data, normalized);
		return normalized;
	};
})();

export const setProfileCache = (uid: string, data: ProfileCache): void => {
	if (profileCache.size >= MAX_CACHE_SIZE) {
		const oldestKey = profileCache.keys().next().value;
		if (oldestKey) profileCache.delete(oldestKey);
	}
	profileCache.delete(uid);
	profileCache.set(uid, data);
};

export const batchMemorySet = (entries: Array<[string, string]>): void => {
	for (let i = 0; i < entries.length; i++) {
		Memory.set(entries[i][0], entries[i][1]);
	}
};
