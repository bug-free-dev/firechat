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
