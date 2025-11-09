import type { FireTime } from '@/app/lib/utils/time';

import type { ID, UID } from './Tuser';

/**
 * Kudos transaction log entry.
 * Stored at /kudos/{txnId}.
 */
export interface KudosTxn {
	id?: ID;
	from: UID | 'SYSTEM';
	to: UID;
	amount: number;
	type: 'gift' | 'reward' | 'purchase' | 'system';
	note?: string | null;
	createdAt: FireTime;
}
export type KudosError =
	| 'INVALID_INPUT'
	| 'USER_NOT_FOUND'
	| 'RECIPIENT_BANNED'
	| 'USER_BANNED'
	| 'INSUFFICIENT_FUNDS'
	| 'CANNOT_SEND_TO_SELF'
	| 'FIRESTORE_ERROR'
	| 'UNKNOWN_ERROR';

export interface KudosResult<T = void> {
	success: boolean;
	data?: T;
	error?: KudosError;
	reason?: string;
}
