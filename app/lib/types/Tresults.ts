import type { UID } from './Tuser';
import type { FireProfile } from './Tuser';

/* ==================== AUTH Results ==================== */

/**
 * Authentication error structure.
 */
export interface AuthError {
	message: string;
	code?: string;
}

/**
 * Result from authentication.
 */
export type AuthResult =
	| { ok: true; data: { user: FireProfile } }
	| { ok: false; error: AuthError };

/**
 * Result from sign-up.
 */
export type SignUpResult = { ok: true; data: { uid: UID } } | { ok: false; error: AuthError };

/* ==================== SERVER RESULTS ==================== */

/**
 * Generic OK result.
 */
export type ResultOk<T> = { ok: true; data: T };

/**
 * Generic Error result.
 */
export type ResultErr = { ok: false; error: string; reason?: string };

/**
 * Server result type.
 */
export type ServerResult<T> = ResultOk<T> | ResultErr;
