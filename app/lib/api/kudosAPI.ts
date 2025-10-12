'use server';

import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

import { adminDb } from '@/app/lib/firebase/FireAdmin';
import type { FireProfile, KudosTxn } from '@/app/lib/types';
import { compare, create, toISO } from '@/app/lib/utils/time';

/**
 * Map Firestore DocumentSnapshot -> KudosTxn (normalized)
 */
function mapKudosDoc(doc: QueryDocumentSnapshot): KudosTxn {
	const raw = doc.data();

	return {
		id: doc.id,
		from: String(raw.from ?? ''),
		to: String(raw.to ?? ''),
		amount: Number(raw.amount ?? 0),
		type: (raw.type as KudosTxn['type']) ?? 'gift',
		note: String(raw.note ?? ''),
		createdAt: toISO(raw.createdAt) || create.nowISO(),
	};
}
/**
 * Fetch kudos balance for a user
 */
export async function getKudosBalance(uid: string): Promise<number> {
	if (!uid) return 0;
	try {
		const snap = await adminDb.collection('users').doc(uid).get();
		if (!snap.exists) return 0;
		const data = snap.data() as Partial<FireProfile> | undefined;
		return Number(data?.kudos ?? 0);
	} catch {
		return 0;
	}
}

/**
 * Fetch recent kudos transactions for a user
 * - Tries the optimal query (orderBy createdAt). If Firestore returns FAILED_PRECONDITION (index needed),
 *   falls back to a limited unordered query and sorts in-memory.
 */
export async function getKudosHistory(uid: string, limit = 20): Promise<KudosTxn[]> {
	if (!uid) return [];

	try {
		// Optimal query (fast if composite index exists: to ASC, createdAt DESC)
		const snap = await adminDb
			.collection('kudos')
			.where('to', '==', uid)
			.orderBy('createdAt', 'desc')
			.limit(limit)
			.get();

		return snap.docs.map(mapKudosDoc);
	} catch {
		// Fallback: fetch more docs without ordering, then sort locally
		try {
			const fallbackLimit = Math.max(limit * 5, 200); // reasonable fallback scope
			const fallbackSnap = await adminDb
				.collection('kudos')
				.where('to', '==', uid)
				.limit(fallbackLimit)
				.get();

			const txns = fallbackSnap.docs.map(mapKudosDoc);
			// Sort by createdAt descending and take requested limit
			txns.sort((a, b) => compare.desc(a.createdAt, b.createdAt));
			return txns.slice(0, limit);
		} catch {
			return [];
		}
	}
}
export async function getKudosHistoryAll(uid: string, limit = 20): Promise<KudosTxn[]> {
	if (!uid) return [];

	const mapSafe = (
		doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
	): KudosTxn => {
		const data = doc.data() as KudosTxn;

		return {
			id: doc.id,
			from: data.from ?? '',
			to: data.to ?? '',
			amount: data.amount ?? 0,
			type: data.type ?? 'gift',
			note: data.note ?? '',
			createdAt: toISO(data.createdAt) || create.nowISO(),
		};
	};

	try {
		const [sentSnap, recvSnap] = await Promise.all([
			adminDb
				.collection('kudos')
				.where('from', '==', uid)
				.orderBy('createdAt', 'desc')
				.limit(limit)
				.get(),
			adminDb
				.collection('kudos')
				.where('to', '==', uid)
				.orderBy('createdAt', 'desc')
				.limit(limit)
				.get(),
		]);

		const txns: KudosTxn[] = [...sentSnap.docs.map(mapSafe), ...recvSnap.docs.map(mapSafe)];

		// Sort descending by createdAt
		txns.sort((a, b) => compare.desc(a.createdAt, b.createdAt));

		return txns.slice(0, limit);
	} catch {
		return [];
	}
}

/**
 * Transfer kudos from one user to another (atomic + logged)
 */
export async function transferKudos(
	fromUid: string,
	toUid: string,
	amount: number,
	note = ''
): Promise<{ success: boolean; reason?: string; txnId?: string }> {
	if (fromUid.length === 0 || toUid.length === 0 || amount <= 0) {
		return { success: false, reason: 'INVALID_INPUT' };
	}

	if (fromUid === toUid) {
		return { success: false, reason: 'CANNOT_SEND_TO_SELF' };
	}

	const fromRef = adminDb.collection('users').doc(fromUid);
	const toRef = adminDb.collection('users').doc(toUid);
	const txnRef = adminDb.collection('kudos').doc();

	try {
		await adminDb.runTransaction(async (tx) => {
			const fromSnap = await tx.get(fromRef);
			const toSnap = await tx.get(toRef);

			if (!fromSnap.exists || !toSnap.exists) {
				throw new Error('USER_NOT_FOUND');
			}

			const fromData = fromSnap.data() as Partial<FireProfile>;
			const toData = toSnap.data() as Partial<FireProfile>;

			// Check if recipient is banned
			if (toData.isBanned) {
				throw new Error('RECIPIENT_BANNED');
			}

			const fromBalance = Number(fromData?.kudos ?? 0);
			if (fromBalance < amount) throw new Error('INSUFFICIENT_FUNDS');

			// Update balances
			tx.update(fromRef, {
				kudos: fromBalance - amount,
				kudosGiven: (Number(fromData?.kudosGiven) || 0) + amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			tx.update(toRef, {
				kudos: (Number(toData?.kudos) || 0) + amount,
				kudosReceived: (Number(toData?.kudosReceived) || 0) + amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			// Log transaction
			const txnData = {
				from: fromUid,
				to: toUid,
				amount,
				type: 'gift' as const,
				note: note || '',
				createdAt: FieldValue.serverTimestamp(),
			};
			tx.set(txnRef, txnData);
		});

		return { success: true, txnId: txnRef.id };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
		return { success: false, reason: message };
	}
}

/**
 * Grant kudos from system (e.g. rewards, admin actions)
 */
export async function grantKudos(
	toUid: string,
	amount: number,
	note = 'system_reward'
): Promise<{ success: boolean; reason?: string; txnId?: string }> {
	if (!toUid || amount <= 0) return { success: false, reason: 'INVALID_INPUT' };

	const toRef = adminDb.collection('users').doc(toUid);
	const txnRef = adminDb.collection('kudos').doc();

	try {
		await adminDb.runTransaction(async (tx) => {
			const toSnap = await tx.get(toRef);
			if (!toSnap.exists) throw new Error('USER_NOT_FOUND');

			const toData = toSnap.data() as Partial<FireProfile>;

			// Check if user is banned
			if (toData.isBanned) {
				throw new Error('USER_BANNED');
			}

			tx.update(toRef, {
				kudos: (Number(toData?.kudos) || 0) + amount,
				kudosReceived: (Number(toData?.kudosReceived) || 0) + amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			const txnData = {
				from: 'SYSTEM',
				to: toUid,
				amount,
				type: 'system' as const,
				note,
				createdAt: FieldValue.serverTimestamp(),
			};
			tx.set(txnRef, txnData);
		});

		return { success: true, txnId: txnRef.id };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
		return { success: false, reason: message };
	}
}

/**
 * Deduct kudos from a user (e.g. penalties, purchases)
 * ✅ NEW: Complement to grantKudos
 */
export async function deductKudos(
	fromUid: string,
	amount: number,
	note = 'system_deduction'
): Promise<{ success: boolean; reason?: string; txnId?: string }> {
	if (!fromUid || amount <= 0) return { success: false, reason: 'INVALID_INPUT' };

	const fromRef = adminDb.collection('users').doc(fromUid);
	const txnRef = adminDb.collection('kudos').doc();

	try {
		await adminDb.runTransaction(async (tx) => {
			const fromSnap = await tx.get(fromRef);
			if (!fromSnap.exists) throw new Error('USER_NOT_FOUND');

			const fromData = fromSnap.data() as Partial<FireProfile>;
			const currentBalance = Number(fromData?.kudos ?? 0);

			if (currentBalance < amount) {
				throw new Error('INSUFFICIENT_FUNDS');
			}

			tx.update(fromRef, {
				kudos: currentBalance - amount,
				lastSeen: FieldValue.serverTimestamp(),
			});

			const txnData = {
				from: fromUid,
				to: 'SYSTEM',
				amount,
				type: 'system' as const,
				note,
				createdAt: FieldValue.serverTimestamp(),
			};
			tx.set(txnRef, txnData);
		});

		return { success: true, txnId: txnRef.id };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
		return { success: false, reason: message };
	}
}

/**
 * Get total kudos stats for a user
 * ✅ NEW: Useful for profile displays
 */
export async function getKudosStats(uid: string): Promise<{
	balance: number;
	given: number;
	received: number;
} | null> {
	if (!uid) return null;

	try {
		const snap = await adminDb.collection('users').doc(uid).get();
		if (!snap.exists) return null;

		const data = snap.data() as Partial<FireProfile>;
		return {
			balance: Number(data?.kudos ?? 0),
			given: Number(data?.kudosGiven ?? 0),
			received: Number(data?.kudosReceived ?? 0),
		};
	} catch {
		return null;
	}
}
