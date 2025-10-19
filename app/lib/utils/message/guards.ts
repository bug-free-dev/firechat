import type { AttachmentType, ChatMessage, MessageContentType } from '@/app/lib/types';

export function isValidAttachmentType(type: string): type is AttachmentType {
	return ['image', 'video', 'file'].includes(type);
}

export function isValidMessageType(type: string): type is MessageContentType {
	return type === 'markdown';
}

export function hasAttachments(message: ChatMessage): boolean {
	return Boolean(message.attachments?.length);
}
