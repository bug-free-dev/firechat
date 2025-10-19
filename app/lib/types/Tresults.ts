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
