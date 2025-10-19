import { MessageAttachment, ResultErr } from '@/app/lib/types';

import { SendMessagePayload } from './types';

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
	const hasAttachments = Boolean(payload.attachments?.length);

	if (!hasText && !hasAttachments) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'text or attachments required' };
	}

	if (payload.text && payload.text.length > 10000) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'text too long (max 10000 chars)' };
	}

	if (payload.attachments && payload.attachments.length > 10) {
		return { ok: false, error: 'INVALID_INPUT', reason: 'too many attachments (max 10)' };
	}

	return null;
}

/**
 * Check if URL is from Firebase Storage (security)
 */
export function isFirebaseStorageUrl(url: string): boolean {
	return url.startsWith('https://firebasestorage.googleapis.com/');
}

/**
 * Validate all attachment URLs are from Firebase Storage
 */
export function validateAttachmentUrls(attachments: readonly MessageAttachment[]): boolean {
	return attachments.every((att) => isFirebaseStorageUrl(att.url));
}
