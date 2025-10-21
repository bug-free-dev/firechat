'use client';

import React, { useEffect, useMemo, useRef } from 'react';

import { ChatMessage, FireCachedUser } from '@/app/lib/types';
import { toMillis } from '@/app/lib/utils/time';

import MessageItem from './MessageItem';

export interface MessageListProps {
	messages: ChatMessage[];
	currentUserUid: string;
	profiles: Record<string, FireCachedUser>;
	onReply: (message: ChatMessage) => void;
	onToggleReaction: (messageId: string, emoji: string) => void;
	onDeleteMessage: (messageId?: string) => void;
	onCopyMessage: (messageId?: string) => void;
}

const MessageList: React.FC<MessageListProps> = React.memo(
	({
		messages,
		currentUserUid,
		profiles,
		onReply,
		onToggleReaction,
		onCopyMessage,
		onDeleteMessage,
	}) => {
		const bottomRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
		}, [messages.length]);

		const grouped = useMemo(() => {
			type Item = {
				message: ChatMessage;
				showAvatar: boolean;
				showTimestamp: boolean;
				replyToMessage?: ChatMessage;
			};

			const out: Item[] = [];
			const messageMap = new Map(messages.map((m) => [m.id, m]));

			for (let i = 0; i < messages.length; i++) {
				const msg = messages[i];
				const prev = messages[i - 1];
				const next = messages[i + 1];

				const msgTime = toMillis(msg.createdAt);
				const prevTime = prev ? toMillis(prev.createdAt) : 0;
				const nextTime = next ? toMillis(next.createdAt) : 0;

				const showAvatar = !prev || prev.sender !== msg.sender || msgTime - prevTime > 120_000; // 2 min
				const showTimestamp =
					!next || next.sender !== msg.sender || nextTime - msgTime > 120_000;

				const replyToMessage = msg.replyTo ? messageMap.get(msg.replyTo) : undefined;

				out.push({ message: msg, showAvatar, showTimestamp, replyToMessage });
			}

			return out;
		}, [messages]);

		if (grouped.length === 0) {
			return (
				<div className="flex items-center justify-center h-full">
					<div className="text-center space-y-3">
						<div className="text-5xl opacity-20">💬</div>
						<div className="text-sm font-medium text-neutral-500">No messages yet</div>
						<div className="text-xs text-neutral-400">Start the conversation</div>
					</div>
				</div>
			);
		}

		return (
			<div
				className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 scroll"
				role="log"
				aria-live="polite"
			>
				<div className="max-w-4xl mx-auto">
					{grouped.map((g, idx) => (
						<MessageItem
							key={g.message.id ?? idx}
							message={g.message}
							isMine={g.message.sender === currentUserUid}
							showAvatar={g.showAvatar}
							showTimestamp={g.showTimestamp}
							displayName={
								profiles[g.message.sender]?.displayName ??
								profiles[g.message.sender]?.usernamey
							}
							avatarUrl={profiles[g.message.sender]?.avatarUrl}
							replyToMessage={g.replyToMessage}
							replyToSender={
								g.replyToMessage ? profiles[g.replyToMessage.sender] : undefined
							}
							currentUserId={currentUserUid}
							onReply={() => onReply(g.message)}
							onToggleReaction={(emoji: string) => onToggleReaction(g.message.id!, emoji)}
							onCopy={() => onCopyMessage(g.message?.text)}
							onDelete={() => onDeleteMessage(g.message.id)}
						/>
					))}
				</div>
				<div ref={bottomRef} />
			</div>
		);
	}
);

export default MessageList;
