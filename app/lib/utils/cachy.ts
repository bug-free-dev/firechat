type MemoryValue = string | number | boolean | Record<string, unknown> | Array<unknown> | null;

const PREFIX = 'firechat_mem_';
const TTL_MS = 2 * 60 * 1000;
const CLEANUP_INTERVAL = 30 * 1000;

type Stored<T> = {
	v: T;
	t: number;
};

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Safe JSON utilities
const safeJSON = {
	parse: <T>(str: string | null): T | null => {
		if (!str) return null;
		try {
			return JSON.parse(str) as T;
		} catch {
			return null;
		}
	},
	stringify: <T>(val: T): string => {
		try {
			return JSON.stringify(val);
		} catch {
			return 'null';
		}
	},
};

// SSR-safe localStorage wrapper
const storage = {
	getItem: (key: string): string | null => {
		if (!isBrowser) return null;
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	setItem: (key: string, value: string): void => {
		if (!isBrowser) return;
		try {
			localStorage.setItem(key, value);
		} catch {
			// Ignore storage errors (quota exceeded, etc.)
		}
	},
	removeItem: (key: string): void => {
		if (!isBrowser) return;
		try {
			localStorage.removeItem(key);
		} catch {
			// Ignore removal errors
		}
	},
	keys: (): string[] => {
		if (!isBrowser) return [];
		try {
			return Object.keys(localStorage);
		} catch {
			return [];
		}
	},
};

export const Memory = (() => {
	let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
	let lastCleanup = 0;

	// Efficient cleanup: only processes expired entries
	const cleanup = (): void => {
		if (!isBrowser) return;

		const now = Date.now();
		const cutoff = now - TTL_MS;

		const keys = storage.keys();
		for (const key of keys) {
			if (!key.startsWith(PREFIX)) continue;

			const item = safeJSON.parse<Stored<MemoryValue>>(storage.getItem(key));
			if (item && item.t < cutoff) {
				storage.removeItem(key);
			}
		}

		lastCleanup = now;
	};

	// Auto-schedule cleanup on next interval
	const scheduleCleanup = (): void => {
		if (!isBrowser || cleanupTimer !== null) return;

		cleanupTimer = setTimeout(() => {
			cleanup();
			cleanupTimer = null;

			// Keep cleaning if there are still items
			if (keys().length > 0) {
				scheduleCleanup();
			}
		}, CLEANUP_INTERVAL);
	};

	// Lazy cleanup: only if enough time has passed
	const maybeCleanup = (): void => {
		if (!isBrowser) return;

		const now = Date.now();
		if (now - lastCleanup >= CLEANUP_INTERVAL) {
			cleanup();
		}
	};

	const set = <T extends MemoryValue>(key: string, value: T): void => {
		if (!isBrowser) return;

		const entry: Stored<T> = { v: value, t: Date.now() };
		storage.setItem(`${PREFIX}${key}`, safeJSON.stringify(entry));
		scheduleCleanup();
	};

	const get = <T extends MemoryValue>(key: string): T | null => {
		if (!isBrowser) return null;

		const data = safeJSON.parse<Stored<T>>(storage.getItem(`${PREFIX}${key}`));
		if (!data) return null;

		const now = Date.now();
		if (now - data.t >= TTL_MS) {
			storage.removeItem(`${PREFIX}${key}`);
			return null;
		}

		return data.v;
	};

	const has = (key: string): boolean => {
		if (!isBrowser) return false;

		const data = safeJSON.parse<Stored<MemoryValue>>(storage.getItem(`${PREFIX}${key}`));
		if (!data) return false;

		const now = Date.now();
		if (now - data.t >= TTL_MS) {
			storage.removeItem(`${PREFIX}${key}`);
			return false;
		}

		return true;
	};

	const remove = (key: string): void => {
		if (!isBrowser) return;
		storage.removeItem(`${PREFIX}${key}`);
	};

	const clearAll = (): void => {
		if (!isBrowser) return;

		const allKeys = storage.keys();
		for (const key of allKeys) {
			if (key.startsWith(PREFIX)) {
				storage.removeItem(key);
			}
		}

		if (cleanupTimer !== null) {
			clearTimeout(cleanupTimer);
			cleanupTimer = null;
		}
		lastCleanup = 0;
	};

	const keys = (): string[] => {
		if (!isBrowser) return [];

		maybeCleanup();

		const result: string[] = [];
		const allKeys = storage.keys();
		const now = Date.now();

		for (const key of allKeys) {
			if (!key.startsWith(PREFIX)) continue;

			const data = safeJSON.parse<Stored<MemoryValue>>(storage.getItem(key));
			if (data && now - data.t < TTL_MS) {
				result.push(key.slice(PREFIX.length));
			}
		}

		return result;
	};

	// Initialize cleanup only in browser
	if (isBrowser) {
		scheduleCleanup();
	}

	return { set, get, has, remove, clearAll, keys };
})();

export const MEMORY_TTL_MS = TTL_MS;
export const MEMORY_PREFIX = PREFIX;
