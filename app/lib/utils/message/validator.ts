import { ResultErr } from '@/app/lib/types';

import { SendMessagePayload } from './typeDefs';

/**
 * Validate message payload before sending
 */
export function validateSendMessagePayload(payload: SendMessagePayload): ResultErr | null {
	if (!payload.sessionId?.trim()) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'sessionId required' };
	}
	if (!payload.senderUid?.trim()) {
		return { ok: false, error: 'AUTH_REQUIRED', reason: 'senderUid required' };
	}

	const hasText = Boolean(payload.text?.trim());

	if (!hasText) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'text required' };
	}

	if (payload.text && payload.text.length > 10000) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'text too long (max 10000 chars)' };
	}

	return null;
}
