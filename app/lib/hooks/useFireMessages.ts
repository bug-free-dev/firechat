'use client';

import { useCallback, useEffect } from 'react';

import type { ChatMessage } from '@/app/lib/types';
import type { UseMessagesOptions, UseMessagesReturn } from '@/app/lib/utils/message/typeDefs';

import { useMessageFetch } from './useMessageFetch';
import { useMessageStore } from './useMessageStore';
import { useMessageSync } from './useMessageSync';

export function useFireMessages(params: UseMessagesOptions): UseMessagesReturn {
	const { sessionId, userUid, services, options = {} } = params;

	const {
		initialLimit = 50,
		liveLimit = 100,
		maxMessagesInMemory = 500,
		typingProfile,
		typingDebounceMs = 1200,
		autoFetchInitial = true,
	} = options;

	if (!sessionId?.trim()) {
		throw new Error('[useFireMessages] sessionId is required');
	}
	if (!userUid?.trim()) {
		throw new Error('[useFireMessages] userUid is required');
	}

	const {
		messages,
		messagesMap,
		isSorted,
		sending,
		upsertMessage,
		removeMessage,
		sendMessage,
		addReaction,
		removeReaction,
		deleteMessage,
		clear: clearStore,
	} = useMessageStore({
		sessionId,
		userUid,
		services,
		maxMessagesInMemory,
	});

	const onMessagesBatch = useCallback(
		(msgs: ChatMessage[]) => {
			msgs.forEach((m) => upsertMessage(m));
		},
		[upsertMessage]
	);

	const { fetchOlder, fetchInitial, isFetching, hasMore } = useMessageFetch({
		sessionId,
		services,
		initialLimit,
		onMessagesBatch,
	});

	const {
		typingUsers,
		setTyping,
		cleanup: cleanupSync,
	} = useMessageSync({
		sessionId,
		userUid,
		liveLimit,
		typingProfile,
		typingDebounceMs,
		onMessageUpsert: upsertMessage,
		onMessageRemove: removeMessage,
	});

	useEffect(() => {
		if (autoFetchInitial) {
			void fetchInitial();
		}
	}, [autoFetchInitial, fetchInitial]);

	const clear = useCallback((): void => {
		cleanupSync();
		clearStore();
	}, [cleanupSync, clearStore]);

	useEffect(() => {
		return () => {
			clear();
		};
	}, [clear]);

	return {
		messages,
		messagesMap,
		sending,
		isSorted,
		typingUsers,
		isFetching,
		hasMore,
		setTyping,
		sendMessage,
		fetchOlder,
		fetchInitial,
		addReaction,
		removeReaction,
		deleteMessage,
		clear,
	};
}
