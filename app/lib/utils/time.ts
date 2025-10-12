import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

/**
 * Comprehensive union type for all possible timestamp formats
 * Covers: ISO strings, epoch ms, Date objects, Firestore timestamps (client & admin)
 */
export type FireTime =
	| string
	| number
	| Date
	| FirestoreTimestamp
	| AdminTimestamp
	| { seconds: number; nanoseconds: number }
	| { _seconds: number; _nanoseconds: number }
	| null
	| undefined;

/* ==================== TYPE GUARDS ==================== */

export const is = {
	/**
	 * Check if value is a Date object
	 */
	date: (value: unknown): value is Date => value instanceof Date,

	/**
	 * Check if value is a valid ISO string
	 */
	isoString: (value: unknown): value is string =>
		typeof value === 'string' && value.length > 0 && !isNaN(Date.parse(value)),

	/**
	 * Check if value is a valid epoch timestamp (milliseconds)
	 */
	epochMs: (value: unknown): value is number =>
		typeof value === 'number' && !isNaN(value) && isFinite(value) && value > 0,

	/**
	 * Check if value is a Firestore Timestamp-like object
	 */
	firestoreTimestamp: (
		value: unknown
	): value is
		| { seconds: number; nanoseconds: number }
		| { _seconds: number; _nanoseconds: number } =>
		value !== null &&
		typeof value === 'object' &&
		(('seconds' in value && 'nanoseconds' in value) ||
			('_seconds' in value && '_nanoseconds' in value)),
} as const;

/* ==================== CORE CONVERSION FUNCTIONS ==================== */

/**
 * Converts any FireTime to milliseconds since Unix epoch
 * Returns 0 for invalid/null inputs (safe default for sorting)
 *
 * @param time - Any supported timestamp format
 * @returns Milliseconds since epoch, or 0 if invalid
 */
export function toMillis(time: FireTime): number {
	if (!time) return 0;

	// Date object
	if (is.date(time)) {
		const ms = time.getTime();
		return is.epochMs(ms) ? ms : 0;
	}

	// Number (assume milliseconds)
	if (is.epochMs(time)) {
		return time;
	}

	// ISO string
	if (is.isoString(time)) {
		const ms = Date.parse(time);
		return is.epochMs(ms) ? ms : 0;
	}

	// Firestore Timestamp object
	if (is.firestoreTimestamp(time)) {
		const seconds = 'seconds' in time ? time.seconds : time._seconds;
		const nanoseconds = 'nanoseconds' in time ? time.nanoseconds : time._nanoseconds;
		return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
	}

	return 0;
}

/**
 * Converts any FireTime to a JavaScript Date object
 * Returns null for invalid inputs
 *
 * @param time - Any supported timestamp format
 * @returns Date object or null
 */
export function toDate(time: FireTime): Date | null {
	const ms = toMillis(time);
	return ms > 0 ? new Date(ms) : null;
}

/**
 * Converts any FireTime to ISO 8601 string
 * Returns empty string for invalid inputs
 *
 * @param time - Any supported timestamp format
 * @returns ISO string or empty string
 */
export function toISO(time: FireTime): string {
	const date = toDate(time);
	return date ? date.toISOString() : '';
}

/**
 * Converts any FireTime to seconds since Unix epoch
 * Returns 0 for invalid inputs
 *
 * @param time - Any supported timestamp format
 * @returns Seconds since epoch
 */
export function toSeconds(time: FireTime): number {
	return Math.floor(toMillis(time) / 1000);
}

/* ==================== CREATION UTILITIES ==================== */

export const create = {
	/**
	 * Get current time as ISO string (normalized format)
	 */
	nowISO: (): string => new Date().toISOString(),

	/**
	 * Get current time as Date object
	 */
	now: (): Date => new Date(),

	/**
	 * Get current time as epoch milliseconds
	 */
	nowMs: (): number => Date.now(),

	/**
	 * Create Date from milliseconds
	 */
	fromMillis: (ms: number): Date => new Date(ms),

	/**
	 * Create Date from seconds
	 */
	fromSeconds: (seconds: number): Date => new Date(seconds * 1000),

	/**
	 * Create ISO string from milliseconds
	 */
	isoFromMillis: (ms: number): string => new Date(ms).toISOString(),
} as const;

/* ==================== FORMATTING ==================== */

/**
 * Format FireTime into human-readable string
 *
 * @param time - Any supported timestamp format
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormatOptions
 * @param fallback - Fallback string for invalid times
 * @returns Formatted string
 */
export function formatTime(
	time: FireTime,
	locale = 'en-US',
	options?: Intl.DateTimeFormatOptions,
	fallback = ''
): string {
	const date = toDate(time);
	return date ? date.toLocaleString(locale, options) : fallback;
}

/* ==================== COMPARISON UTILITIES ==================== */

export const compare = {
	/**
	 * Compare two FireTime values (for sorting ascending)
	 * Returns: -1 if a < b, 0 if equal, 1 if a > b
	 */
	asc: (a: FireTime, b: FireTime): number => {
		const msA = toMillis(a);
		const msB = toMillis(b);
		return msA - msB;
	},

	/**
	 * Compare two FireTime values (for sorting descending)
	 * Returns: 1 if a < b, 0 if equal, -1 if a > b
	 */
	desc: (a: FireTime, b: FireTime): number => {
		const msA = toMillis(a);
		const msB = toMillis(b);
		return msB - msA;
	},

	/**
	 * Check if two FireTime values are equal (within 1ms tolerance)
	 */
	equal: (a: FireTime, b: FireTime): boolean => Math.abs(toMillis(a) - toMillis(b)) < 1,

	/**
	 * Check if time A is before time B
	 */
	isBefore: (a: FireTime, b: FireTime): boolean => toMillis(a) < toMillis(b),

	/**
	 * Check if time A is after time B
	 */
	isAfter: (a: FireTime, b: FireTime): boolean => toMillis(a) > toMillis(b),
} as const;

/* ==================== VALIDATION ==================== */

export const validate = {
	/**
	 * Check if FireTime is valid and non-zero
	 */
	isValid: (time: FireTime): boolean => toMillis(time) > 0,

	/**
	 * Check if FireTime represents a future timestamp
	 */
	isFuture: (time: FireTime): boolean => toMillis(time) > Date.now(),

	/**
	 * Check if FireTime represents a past timestamp
	 */
	isPast: (time: FireTime): boolean => {
		const ms = toMillis(time);
		return ms > 0 && ms < Date.now();
	},
} as const;

/* ==================== UTILITY ==================== */

/**
 * Sleep/delay utility (async)
 */
export const sleep = (ms = 300): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/* ==================== DEFAULT EXPORT ==================== */

export default {
	is,
	toMillis,
	toDate,
	toISO,
	toSeconds,
	create,
	formatTime,
	compare,
	validate,
	sleep,
} as const;
