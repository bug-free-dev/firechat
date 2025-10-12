import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase/FireAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 250;
const RESET_AMOUNT = 500;

const FUEL_MESSAGES = [
	'🔋 FUEL TANK REFILLED! Time to spread the love again!',
	"⚡ KUDOS RELOADED! You're all charged up! 🚀",
	'💝 Fresh kudos incoming! Ready to uplift someone? ',
	'🎯 Boom! Your kudos meter is back to MAXIMUM! 💪',
	"Refuel complete! Go make someone's day! 🎉",
	'🔥 KUDOS RESET TO 500! Time to shine bright! 💎',
];

export async function GET(req: NextRequest): Promise<NextResponse> {
	const authHeader = req.headers.get('authorization') || '';
	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const usersSnapshot = await adminDb.collection('users').select('__name__').get();
		const userDocs = usersSnapshot.docs;

		let updated = 0;
		let failed = 0;

		for (let i = 0; i < userDocs.length; i += BATCH_SIZE) {
			const batch = adminDb.batch();
			const end = Math.min(i + BATCH_SIZE, userDocs.length);

			for (let j = i; j < end; j++) {
				const userId = userDocs[j].id;
				const message = FUEL_MESSAGES[Math.floor(Math.random() * FUEL_MESSAGES.length)];

				batch.update(adminDb.collection('users').doc(userId), {
					kudos: RESET_AMOUNT,
					lastSeen: FieldValue.serverTimestamp(),
				});

				batch.set(adminDb.collection('kudos').doc(), {
					from: 'SYSTEM',
					to: userId,
					amount: RESET_AMOUNT,
					type: 'system',
					note: message,
					createdAt: FieldValue.serverTimestamp(),
				});
			}

			try {
				await batch.commit();
				updated += end - i;
			} catch {
				failed += end - i;
			}
		}

		return NextResponse.json({
			success: true,
			updated,
			failed,
			timestamp: new Date().toISOString(),
		});
	} catch {
		return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
	}
}

export const runtime = 'nodejs';
export const maxDuration = 60;
