import { DEFAULT_API_VERSION, DEFAULT_RADIUS, DEFAULT_THEME } from './constants';

export type AvatarFormat = 'svg' | 'png';

export type AvatarOpts = {
	seed?: string;
	theme?: string;
	size?: number;
	background?: string;
	radius?: number;
	format?: AvatarFormat;
	apiVersion?: string;
	extra?: Record<string, string | number | boolean>;
};

const normalize = (v?: string) => (v ?? '').trim();

const normalizeHex = (hex?: string) => {
	const v = normalize(hex);
	if (!v) return '';
	return v.startsWith('#') ? v.slice(1) : v;
};

export const namespacedSeed = (raw?: string) => {
	const s = normalize(raw) || 'user';
	return s;
};

const clampRadius = (r?: number) => {
	if (typeof r !== 'number' || Number.isNaN(r)) return DEFAULT_RADIUS;
	return Math.min(100, Math.max(0, Math.floor(r)));
};

export const buildDicebearQuery = (opts: {
	seed: string;
	size?: number;
	background?: string;
	radius?: number;
	extra?: Record<string, string | number | boolean>;
}) => {
	const params = new URLSearchParams();
	params.set('seed', opts.seed);
	if (opts.size) params.set('size', String(opts.size));
	if (opts.background) params.set('background', normalizeHex(opts.background));
	params.set('radius', String(clampRadius(opts.radius)));
	if (opts.extra) {
		Object.entries(opts.extra).forEach(([k, v]) => {
			if (v === null || v === undefined || v === false) return;
			params.set(k, String(v));
		});
	}
	return params.toString();
};

export const getDicebearUrl = (options: AvatarOpts = {}) => {
	const {
		seed = 'firechat-user',
		theme = DEFAULT_THEME,
		size,
		background = '',
		radius = DEFAULT_RADIUS,
		format = 'svg',
		apiVersion = DEFAULT_API_VERSION,
		extra,
	} = options;

	const finalSeed = namespacedSeed(seed);
	const q = buildDicebearQuery({ seed: finalSeed, size, background, radius, extra });
	const type = format === 'png' ? 'png' : 'svg';
	return `https://api.dicebear.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(theme)}/${type}?${q}`;
};

/** convenience wrappers */
export const getSvgUrl = (opts: Omit<AvatarOpts, 'format'> = {}) =>
	getDicebearUrl({ ...opts, format: 'svg' });
export const getPngUrl = (opts: Omit<AvatarOpts, 'format'> = {}) =>
	getDicebearUrl({ ...opts, format: 'png' });

/** small helper: random seed */
export const randomSeed = (len = 9) =>
	Math.random()
		.toString(36)
		.substring(2, 2 + len);
