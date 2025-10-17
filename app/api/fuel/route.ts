import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase/FireAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import {DEFAULT_KUDOS} from"@/app/lib/types"

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 500;
const RESET_AMOUNT = DEFAULT_KUDOS;

export async function GET(req: NextRequest): Promise<NextResponse> {
	const authHeader = req.headers.get('authorization') || '';
	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const start = Date.now();
	let updated = 0;
	let failed = 0;

	try {
		const userRefs = await adminDb.collection('users').listDocuments();

		if (!userRefs || userRefs.length === 0) {
			return NextResponse.json({
				success: true,
				updated: 0,
				failed: 0,
				note: 'no users found',
				durationMs: Date.now() - start,
			});
		}

		let batch = adminDb.batch();
		let inBatch = 0;

		for (const docRef of userRefs) {
			batch.update(docRef, {
				kudos: RESET_AMOUNT,
				lastRefillAt: FieldValue.serverTimestamp(),
			});
			inBatch++;

			if (inBatch >= BATCH_SIZE) {
				try {
					await batch.commit();
					updated += inBatch;
				} catch {
					failed += inBatch;
				}
				batch = adminDb.batch();
				inBatch = 0;
			}
		}

		if (inBatch > 0) {
			try {
				await batch.commit();
				updated += inBatch;
			} catch {
				failed += inBatch;
			}
		}

		return NextResponse.json({
			success: true,
			updated,
			failed,
			totalCandidates: userRefs.length,
			durationMs: Date.now() - start,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		return NextResponse.json(
			{ success: false, error: 'Failed', details: (err as Error).message },
			{ status: 500 }
		);
	}
}

export const runtime = 'nodejs';
export const maxDuration = 120;
