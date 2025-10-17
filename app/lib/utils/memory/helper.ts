import type { FireCachedUser, FireProfile } from '@/app/lib/types';
import { type FireTime, toISO } from '../time';

const toISOString = (value: FireTime): string | undefined => toISO(value) || undefined;

export function extractUserMeta(data: Partial<FireProfile>): Record<string, unknown> | undefined {
  const meta: Record<string, unknown> = {};

  if (data.mood) meta.mood = data.mood;
  if (data.status) meta.status = data.status;
  if (data.about) meta.about = data.about;
  if (data.tags?.length) meta.tags = data.tags;
  if (data.quirks?.length) meta.quirks = data.quirks;
  if (data.identifierKey) meta.identifierKey = data.identifierKey;

  if (data.meta && typeof data.meta === 'object' && !Array.isArray(data.meta)) {
    Object.assign(meta, data.meta);
  }

  return Object.keys(meta).length > 0 ? meta : undefined;
}

export function createCachedUser(
  data: Partial<FireProfile>,
  docId: string
): FireCachedUser | null {
  const uid = String(data.uid ?? docId);

  const usernamey =
    typeof data.usernamey === 'string' && data.usernamey.trim()
      ? data.usernamey.trim()
      : undefined;

  if (!uid || !usernamey) return null;

  return {
    uid,
    usernamey: String(usernamey),
    displayName: String(data.displayName ?? usernamey),
    avatarUrl: data.avatarUrl ?? null,
    kudos: Number.isFinite(Number(data.kudos ?? 0)) ? Number(data.kudos ?? 0) : 0,
    isBanned: Boolean(data.isBanned),
    createdAt: toISOString(data.createdAt as FireTime),
    lastSeen: toISOString(data.lastSeen as FireTime),
    meta: extractUserMeta(data),
  };
}

export const cloneSerializableUser = (user: FireCachedUser): FireCachedUser => ({
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

export const isValidUser = (user: FireCachedUser | undefined): user is FireCachedUser =>
	!!user && !user.isBanned;