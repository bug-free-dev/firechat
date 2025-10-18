import { FireTime, toMillis, validate } from '@/app/lib/utils/time';

export interface UserMetadata {
	mood?: string;
	status?: string;
	about?: string;
	tags?: string[];
	quirks?: string[];
}

export function extractMetadata(meta?: Record<string, unknown>): UserMetadata {
	if (!meta) return {};
	return {
		mood: typeof meta.mood === 'string' ? meta.mood : undefined,
		status: typeof meta.status === 'string' ? meta.status : undefined,
		about: typeof meta.about === 'string' ? meta.about : undefined,
		tags: Array.isArray(meta.tags) ? meta.tags.filter((t) => typeof t === 'string') : undefined,
		quirks: Array.isArray(meta.quirks)
			? meta.quirks.filter((q) => typeof q === 'string')
			: undefined,
	};
}

export function isRecentlyActive(lastSeen?: FireTime): boolean {
	if (!validate.isValid(lastSeen)) return false;
	const lastSeenMs = toMillis(lastSeen);
	const diff = Date.now() - lastSeenMs;
	return diff <= 5 * 60 * 1000 && diff >= 0;
}

export function relativeTimeFromMs(ms: number): string {
	const s = Math.round((Date.now() - ms) / 1000);
	if (s < 10) return 'just now';
	if (s < 60) return `${s}s ago`;
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.round(h / 24);
	return `${d}d ago`;
}

export const TAG_COLORS = [
	'bg-blue-50 text-blue-700 border-blue-200',
	'bg-indigo-50 text-indigo-700 border-indigo-200',
	'bg-pink-50 text-pink-700 border-pink-200',
	'bg-neutral-50 text-neutral-700 border-neutral-200',
	'bg-lime-50 text-lime-700 border-lime-200',
	'bg-rose-50 text-rose-700 border-rose-200',
	'bg-cyan-50 text-cyan-700 border-cyan-200',
	'bg-purple-50 text-purple-700 border-purple-200',
];

export const getTagColor = (index: number): string => TAG_COLORS[index % TAG_COLORS.length];
