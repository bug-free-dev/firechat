'use server';

import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

import { adminDb } from '@/app/lib/firebase/FireAdmin';
import type { FireProfile, KudosResult, KudosTxn } from '@/app/lib/types';
import { compare, create, toISO } from '@/app/lib/utils/time';

/* <----- DOCUMENT MAPPING -----> */

function mapKudosDoc(doc: QueryDocumentSnapshot): KudosTxn | null {
	try {
		const raw = doc.data();

		if (!raw.from || !raw.to || typeof raw.amount !== 'number') {
			return null;
		}

		const createdAt = toISO(raw.createdAt) || create.nowISO();

		return {
			id: doc.id,
			from: String(raw.from),
			to: String(raw.to),
			amount: Number(raw.amount),
			type: (raw.type as KudosTxn['type']) || 'gift',
			note: String(raw.note || ''),
			createdAt,
		};
	} catch {
		return null;
	}
}

/**
 * Batch map documents with error resilience
 */
function mapDocsBatch(docs: QueryDocumentSnapshot[]): KudosTxn[] {
	return docs.map(mapKudosDoc).filter((txn): txn is KudosTxn => txn !== null);
}

/* <----- READ OPERATIONS -----> */
/**
 * Fetch user's kudos balance
 * Returns 0 for missing/invalid users (safe default)
 */
export async function getKudosBalance(uid: string): Promise<number> {
	if (!uid?.trim()) return 0;

	try {
		const snap = await adminDb.collection('users').doc(uid).get();
		if (!snap.exists) return 0;

		const data = snap.data() as Partial<FireProfile>;
		const balance = Number(data?.kudos ?? 0);

		return isNaN(balance) || balance < 0 ? 0 : balance;
	} catch {
		return 0;
	}
}

/**
 * Fetch ALL transactions (sent + received) with robust fallback
 * CRITICAL: This is the main function used by useKudos hook
 */
export async function getKudosHistoryAll(uid: string, limit = 15): Promise<KudosTxn[]> {
	if (!uid?.trim()) return [];

	try {
		const [sentSnap, recvSnap] = await Promise.all([
			adminDb
				.collection('kudos')
				.where('from', '==', uid)
				.orderBy('createdAt', 'desc')
				.limit(limit)
				.get()
				.catch(() => null),
			adminDb
				.collection('kudos')
				.where('to', '==', uid)
				.orderBy('createdAt', 'desc')
				.limit(limit)
				.get()
				.catch(() => null),
		]);

		const txns: KudosTxn[] = [];

		if (sentSnap && !sentSnap.empty) {
			txns.push(...mapDocsBatch(sentSnap.docs));
		}

		if (recvSnap && !recvSnap.empty) {
			txns.push(...mapDocsBatch(recvSnap.docs));
		}

		// If primary strategy succeeded with some data, return it
		if (txns.length > 0) {
			// Deduplicate by ID
			const unique = Array.from(new Map(txns.map((t) => [t.id, t])).values());

			// Sort by createdAt descending using time.ts
			unique.sort((a, b) => compare.desc(a.createdAt, b.createdAt));

			return unique.slice(0, limit);
		}

		const [sentFallback, recvFallback] = await Promise.all([
			adminDb
				.collection('kudos')
				.where('from', '==', uid)
				.limit(limit * 2)
				.get()
				.catch(() => null),
			adminDb
				.collection('kudos')
				.where('to', '==', uid)
				.limit(limit * 2)
				.get()
				.catch(() => null),
		]);

		const fallbackTxns: KudosTxn[] = [];

		if (sentFallback && !sentFallback.empty) {
			fallbackTxns.push(...mapDocsBatch(sentFallback.docs));
		}

		if (recvFallback && !recvFallback.empty) {
			fallbackTxns.push(...mapDocsBatch(recvFallback.docs));
		}

		// Deduplicate and sort
		const uniqueFallback = Array.from(new Map(fallbackTxns.map((t) => [t.id, t])).values());
		uniqueFallback.sort((a, b) => compare.desc(a.createdAt, b.createdAt));

		return uniqueFallback.slice(0, limit);
	} catch {
		return [];
	}
}

/**
 * Get comprehensive kudos stats
 */
export async function getKudosStats(uid: string): Promise<{
	balance: number;
	given: number;
	received: number;
} | null> {
	if (!uid?.trim()) return null;

	try {
		const snap = await adminDb.collection('users').doc(uid).get();
		if (!snap.exists) return null;

		const data = snap.data() as Partial<FireProfile>;
		return {
			balance: Number(data?.kudos ?? 0) || 0,
			given: Number(data?.kudosGiven ?? 0) || 0,
			received: Number(data?.kudosReceived ?? 0) || 0,
		};
	} catch {
		return null;
	}
}

/* <----- WRITE OPERATIONS -----> */

/**
 * Transfer kudos between users (atomic transaction)
 */
export async function transferKudos(
	fromUid: string,
	toUid: string,
	amount: number,
	note = ''
): Promise<KudosResult<{ txnId: string }>> {
	if (!fromUid?.trim() || !toUid?.trim()) {
		return { success: false, error: 'INVALID_INPUT', reason: 'Missing user IDs' };
	}

	if (amount <= 0 || !isFinite(amount)) {
		return { success: false, error: 'INVALID_INPUT', reason: 'Invalid amount' };
	}

	if (fromUid === toUid) {
		return { success: false, error: 'CANNOT_SEND_TO_SELF', reason: 'Cannot send to yourself' };
	}

	const fromRef = adminDb.collection('users').doc(fromUid);
	const toRef = adminDb.collection('users').doc(toUid);
	const txnRef = adminDb.collection('kudos').doc();

	try {
		await adminDb.runTransaction(async (tx) => {
			const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);

			if (!fromSnap.exists) {
				throw new Error('SENDER_NOT_FOUND');
			}
			if (!toSnap.exists) {
				throw new Error('RECIPIENT_NOT_FOUND');
			}

			const fromData = fromSnap.data() as Partial<FireProfile>;
			const toData = toSnap.data() as Partial<FireProfile>;

			// Check recipient status
			if (toData.isBanned) {
				throw new Error('RECIPIENT_BANNED');
			}

			// Check sender balance
			const fromBalance = Number(fromData?.kudos ?? 0);
			if (fromBalance < amount) {
				throw new Error('INSUFFICIENT_FUNDS');
			}

			// Update sender
			tx.update(fromRef, {
				kudos: fromBalance - amount,
				kudosGiven: (Number(fromData?.kudosGiven) || 0) + amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			// Update recipient
			tx.update(toRef, {
				kudos: (Number(toData?.kudos) || 0) + amount,
				kudosReceived: (Number(toData?.kudosReceived) || 0) + amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			// Log transaction
			tx.set(txnRef, {
				from: fromUid,
				to: toUid,
				amount,
				type: 'gift' as const,
				note: note?.trim() || '',
				createdAt: FieldValue.serverTimestamp(),
			});
		});

		return {
			success: true,
			data: { txnId: txnRef.id },
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';

		// Map error messages to types
		if (message.includes('NOT_FOUND')) {
			return { success: false, error: 'USER_NOT_FOUND', reason: message };
		}
		if (message === 'RECIPIENT_BANNED') {
			return { success: false, error: 'RECIPIENT_BANNED', reason: 'Recipient is banned' };
		}
		if (message === 'INSUFFICIENT_FUNDS') {
			return { success: false, error: 'INSUFFICIENT_FUNDS', reason: 'Not enough kudos' };
		}

		return { success: false, error: 'UNKNOWN_ERROR', reason: message };
	}
}

/**
 * Grant kudos from system (rewards, bonuses)
 */
export async function grantKudos(
	toUid: string,
	amount: number,
	note = 'system_reward'
): Promise<KudosResult<{ txnId: string }>> {
	if (!toUid?.trim()) {
		return { success: false, error: 'INVALID_INPUT', reason: 'Missing user ID' };
	}

	if (amount <= 0 || !isFinite(amount)) {
		return { success: false, error: 'INVALID_INPUT', reason: 'Invalid amount' };
	}

	const toRef = adminDb.collection('users').doc(toUid);
	const txnRef = adminDb.collection('kudos').doc();

	try {
		await adminDb.runTransaction(async (tx) => {
			const toSnap = await tx.get(toRef);
			if (!toSnap.exists) {
				throw new Error('USER_NOT_FOUND');
			}

			const toData = toSnap.data() as Partial<FireProfile>;

			if (toData.isBanned) {
				throw new Error('USER_BANNED');
			}

			tx.update(toRef, {
				kudos: (Number(toData?.kudos) || 0) + amount,
				kudosReceived: (Number(toData?.kudosReceived) || 0) + amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			tx.set(txnRef, {
				from: 'SYSTEM',
				to: toUid,
				amount,
				type: 'system' as const,
				note: note?.trim() || 'system_reward',
				createdAt: FieldValue.serverTimestamp(),
			});
		});

		return {
			success: true,
			data: { txnId: txnRef.id },
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';

		if (message === 'USER_NOT_FOUND') {
			return { success: false, error: 'USER_NOT_FOUND', reason: 'User not found' };
		}
		if (message === 'USER_BANNED') {
			return { success: false, error: 'USER_BANNED', reason: 'User is banned' };
		}

		return { success: false, error: 'UNKNOWN_ERROR', reason: message };
	}
}

/**
 * Deduct kudos from user (purchases, penalties)
 */
export async function deductKudos(
	fromUid: string,
	amount: number,
	note = 'system_deduction'
): Promise<KudosResult<{ txnId: string }>> {
	if (!fromUid?.trim()) {
		return { success: false, error: 'INVALID_INPUT', reason: 'Missing user ID' };
	}

	if (amount <= 0 || !isFinite(amount)) {
		return { success: false, error: 'INVALID_INPUT', reason: 'Invalid amount' };
	}

	const fromRef = adminDb.collection('users').doc(fromUid);
	const txnRef = adminDb.collection('kudos').doc();

	try {
		await adminDb.runTransaction(async (tx) => {
			const fromSnap = await tx.get(fromRef);
			if (!fromSnap.exists) {
				throw new Error('USER_NOT_FOUND');
			}

			const fromData = fromSnap.data() as Partial<FireProfile>;
			const currentBalance = Number(fromData?.kudos ?? 0);

			if (currentBalance < amount) {
				throw new Error('INSUFFICIENT_FUNDS');
			}

			tx.update(fromRef, {
				kudos: currentBalance - amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			tx.set(txnRef, {
				from: fromUid,
				to: 'SYSTEM',
				amount,
				type: 'system' as const,
				note: note?.trim() || 'system_deduction',
				createdAt: FieldValue.serverTimestamp(),
			});
		});

		return {
			success: true,
			data: { txnId: txnRef.id },
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';

		if (message === 'USER_NOT_FOUND') {
			return { success: false, error: 'USER_NOT_FOUND', reason: 'User not found' };
		}
		if (message === 'INSUFFICIENT_FUNDS') {
			return { success: false, error: 'INSUFFICIENT_FUNDS', reason: 'Not enough kudos' };
		}

		return { success: false, error: 'UNKNOWN_ERROR', reason: message };
	}
}
