'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ChatMessage, ServerResult } from '@/app/lib/types';
import { compareMsgsAsc } from '@/app/lib/utils/message/helpers';
import type {
	UseMessageStoreParams,
	UseMessageStoreReturn,
} from '@/app/lib/utils/message/typeDefs';
import { toMillis } from '@/app/lib/utils/time';

const MAX_TEXT_LENGTH = 10000;
const MAX_EMOJI_LENGTH = 10;

export function useMessageStore(params: UseMessageStoreParams): UseMessageStoreReturn {
	const { sessionId, userUid, services, maxMessagesInMemory = 500 } = params;

	const [messageVersion, setMessageVersion] = useState(0);
	const [sending, setSending] = useState(false);

	const messagesMapRef = useRef<Map<string, ChatMessage>>(new Map());
	const messagesCacheRef = useRef<ChatMessage[] | null>(null);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const triggerUpdate = useCallback((): void => {
		if (!isMountedRef.current) return;
		messagesCacheRef.current = null;
		setMessageVersion((v) => v + 1);
	}, []);

	const upsertMessage = useCallback(
		(msg: ChatMessage): void => {
			if (!msg?.id?.trim()) return;

			const existing = messagesMapRef.current.get(msg.id);

			if (
				existing &&
				toMillis(existing.createdAt) === toMillis(msg.createdAt) &&
				JSON.stringify(existing.reactions) === JSON.stringify(msg.reactions) &&
				existing.text === msg.text
			) {
				return;
			}

			messagesMapRef.current.set(msg.id, msg);
			triggerUpdate();
		},
		[triggerUpdate]
	);

	const removeMessage = useCallback(
		(msgId: string): void => {
			if (!msgId?.trim() || !messagesMapRef.current.has(msgId)) return;
			messagesMapRef.current.delete(msgId);
			triggerUpdate();
		},
		[triggerUpdate]
	);

	const sendMessage = useCallback(
		async (
			text: string,
			replyTo?: string,
			extras?: Record<string, unknown>
		): Promise<ServerResult<ChatMessage>> => {
			if (!sessionId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing sessionId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}

			const trimmedText = text?.trim();
			if (!trimmedText) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'text required' };
			}

			if (trimmedText.length > MAX_TEXT_LENGTH) {
				return {
					ok: false,
					error: 'INVALID_INPUT',
					reason: `text too long (max ${MAX_TEXT_LENGTH} chars)`,
				};
			}

			setSending(true);

			try {
				const res = await services.sendMessage({
					sessionId,
					senderUid: userUid,
					text: trimmedText,
					replyTo: replyTo?.trim() || undefined,
					extras,
				});

				return res;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'SEND_FAILED', reason: errorMessage };
			} finally {
				setSending(false);
			}
		},
		[sessionId, userUid, services]
	);

	const addReaction = useCallback(
		async (messageId: string, emoji: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}
			if (!emoji?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing emoji' };
			}
			if (emoji.length > MAX_EMOJI_LENGTH) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'emoji too long' };
			}

			const m = messagesMapRef.current.get(messageId);
			if (!m) {
				return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };
			}

			const arr = Array.isArray(m.reactions?.[emoji]) ? [...m.reactions[emoji]] : [];

			if (arr.includes(userUid)) {
				return { ok: true, data: null };
			}

			try {
				const res = await services.addReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});

				return res;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId]
	);

	const removeReaction = useCallback(
		async (messageId: string, emoji: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}
			if (!emoji?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing emoji' };
			}

			const m = messagesMapRef.current.get(messageId);
			if (!m) {
				return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };
			}

			const arr = Array.isArray(m.reactions?.[emoji]) ? [...m.reactions[emoji]] : [];
			const idx = arr.indexOf(userUid);

			if (idx === -1) {
				return { ok: true, data: null };
			}

			try {
				const res = await services.removeReaction({
					messageId,
					sessionId,
					userId: userUid,
					emoji,
				});

				return res;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'REACT_REMOVE_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId]
	);

	const deleteMessage = useCallback(
		async (messageId: string): Promise<ServerResult<null>> => {
			if (!messageId?.trim()) {
				return { ok: false, error: 'INVALID_INPUT', reason: 'missing messageId' };
			}
			if (!userUid?.trim()) {
				return { ok: false, error: 'AUTH_REQUIRED', reason: 'missing userUid' };
			}

			const m = messagesMapRef.current.get(messageId);
			if (!m) {
				return { ok: false, error: 'NOT_FOUND', reason: 'message not found' };
			}

			try {
				const res = await services.deleteMessage({
					messageId,
					sessionId,
					callerUid: userUid,
				});

				return res;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				return { ok: false, error: 'DELETE_FAILED', reason: errorMessage };
			}
		},
		[services, userUid, sessionId]
	);

	const clear = useCallback((): void => {
		messagesMapRef.current.clear();
		messagesCacheRef.current = null;

		if (isMountedRef.current) {
			setMessageVersion(0);
			setSending(false);
		}
	}, []);

	const messages = useMemo<ChatMessage[]>(() => {
		if (messagesCacheRef.current) return messagesCacheRef.current;

		const allMessages = Array.from(messagesMapRef.current.values());
		allMessages.sort(compareMsgsAsc);

		if (allMessages.length > maxMessagesInMemory) {
			const keep = allMessages.slice(-maxMessagesInMemory);
			messagesMapRef.current = new Map(keep.map((m) => [m.id, m]));
			messagesCacheRef.current = keep;
			return keep;
		}

		messagesCacheRef.current = allMessages;
		return allMessages;
	}, [messageVersion, maxMessagesInMemory]);

	return {
		messages,
		messagesMap: messagesMapRef.current,
		isSorted: true as const,
		sending,
		upsertMessage,
		removeMessage,
		sendMessage,
		addReaction,
		removeReaction,
		deleteMessage,
		clear,
	};
}
