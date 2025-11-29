'use client';

import React, { memo, useRef } from 'react';

import { useAutoScroll } from '@/app/components/RoomUI/hooks/useAutoScroll';
import { useMessageGroup } from '@/app/components/RoomUI/hooks/useMessageGroup';
import { MsgItem } from '@/app/components/RoomUI/ui/blocks';
import type { CachedUser, ChatMessage } from '@/app/lib/types';

interface Props {
	messages: ChatMessage[];
	messagesMap: Map<string, ChatMessage>;
	currentUserUid: string;
	profiles: Record<string, CachedUser>;
	isFetching?: boolean;
	hasMore?: boolean;
	onReply: (message: ChatMessage) => void;
	onToggleReaction: (messageId: string, emoji: string) => void;
	onCopyMessage: (text: string) => void;
	onDeleteMessage: (messageId?: string) => void;
	onLoadMore?: () => void;
}

const VMsgList = memo(
	({
		messages,
		messagesMap,
		currentUserUid,
		profiles,
		isFetching = false,
		hasMore = false,
		onReply,
		onToggleReaction,
		onCopyMessage,
		onDeleteMessage,
		onLoadMore,
	}: Props) => {
		const scrollContainerRef = useRef<HTMLDivElement>(null);
		const grouped = useMessageGroup(messages, messagesMap);

		useAutoScroll({
			messages,
			hasMore,
			isFetching,
			onLoadMore,
			containerRef: scrollContainerRef,
		});

		if (grouped.length === 0) {
			return (
				<div className="flex items-center justify-center h-full">
					<div className="text-center space-y-3">
						<div className="text-5xl opacity-20">💬</div>
						<div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
							No messages yet
						</div>
						<div className="text-xs text-neutral-400 dark:text-neutral-500">
							Start the conversation
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="relative h-full flex flex-col">
				<div
					ref={scrollContainerRef}
					className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4"
				>
					<div className="max-w-4xl mx-auto space-y-1">
						{isFetching && hasMore && (
							<div className="flex items-center justify-center py-4">
								<div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-300 border-t-yellow-500 dark:border-neutral-600 dark:border-t-yellow-400" />
							</div>
						)}

						{grouped.map((o) => (
							<div key={o.message.id}>
								<MsgItem
									message={o.message}
									isMine={o.message.sender === currentUserUid}
									showAvatar={o.showAvatar}
									displayName={
										profiles[o.message.sender]?.displayName ??
										profiles[o.message.sender]?.usernamey
									}
									avatarUrl={profiles[o.message.sender]?.avatarUrl}
									replyToMessage={o.replyToMessage}
									replyToSender={
										o.replyToMessage ? profiles[o.replyToMessage.sender] : undefined
									}
									currentUserId={currentUserUid}
									onReply={() => onReply(o.message)}
									onToggleReaction={(emoji: string) =>
										onToggleReaction(o.message.id!, emoji)
									}
									onCopy={() => onCopyMessage(o.message?.text)}
									onDelete={() => onDeleteMessage(o.message.id)}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}
);

export default VMsgList;
