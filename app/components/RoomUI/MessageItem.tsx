'use client';

import React, { useState } from 'react';
import { FaCopy, FaReply, FaSmile, FaTrash } from 'react-icons/fa';

import { ChatMessage, FireCachedUser } from '@/app/lib/types';
import { formatTime } from '@/app/lib/utils/time';

import FireAvatar from '../UI/FireAvatar';
import MarkdownRenderer from './MarkdownRenderer';
import ReactionPicker from './ReactionPicker';
import ReactionsDisplay from './ReactionsDisplay';
import ReplyPreview from './ReplyPreview';
import StatusIndicator from './StatusIndicator';

interface MessageItemProps {
	message: ChatMessage;
	isMine: boolean;
	showAvatar?: boolean;
	showTimestamp?: boolean;
	displayName?: string;
	avatarUrl?: string | null;
	replyToMessage?: ChatMessage;
	replyToSender?: FireCachedUser;
	currentUserId: string;
	onReply: () => void;
	onToggleReaction: (emoji: string) => void;
	onDelete?: () => void;
	onCopy?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(
	({
		message,
		isMine,
		showAvatar,
		showTimestamp,
		displayName,
		avatarUrl,
		replyToMessage,
		replyToSender,
		currentUserId,
		onReply,
		onToggleReaction,
		onCopy,
		onDelete,
	}) => {
		const [showReactionPicker, setShowReactionPicker] = useState(false);

		return (
			<div
				className={`flex gap-2 sm:gap-3 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-3 sm:mb-4 group`}
			>
				{showAvatar ? (
					<div className="flex-shrink-0">
						<FireAvatar seed={message.sender} size={26} src={avatarUrl} />
					</div>
				) : (
					<div className="w-9 flex-shrink-0" />
				)}

				<div
					className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[65%] lg:max-w-[65%]`}
				>
					{!isMine && displayName && showAvatar && (
						<div className="text-xs text-neutral-500 mb-1 px-1 font-medium">
							{displayName}
						</div>
					)}

					<div className="relative">
						<div
							className={`rounded-xl max-h-full py-1.5 px-2 ${
								isMine
									? 'bg-neutral-800 text-white'
									: 'bg-white border border-neutral-200 text-neutral-800'
							}`}
						>
							{message.replyTo && replyToMessage && (
								<ReplyPreview
									replyToMessage={replyToMessage}
									sender={replyToSender}
									compact
								/>
							)}

							<div className="text-sm sm:text-base">
								<MarkdownRenderer
									content={message.text}
									className={isMine ? 'text-white' : 'text-neutral-800'}
								/>
							</div>

							{message.reactions && (
								<ReactionsDisplay
									reactions={message.reactions}
									currentUserId={currentUserId}
									onToggle={onToggleReaction}
								/>
							)}
						</div>

						{/* Action buttons */}
						<div className="mt-2 right-2 flex items-center gap-1 ">
							{/* Reply Button */}
							<button
								onClick={onReply}
								className="bg-blue-100 rounded-full p-1.5 hover:bg-blue-200 transition-colors shadow-sm"
								aria-label="Reply"
							>
								<FaReply className="w-3 h-3 text-blue-400" />
							</button>

							{/* Reaction Picker */}
							<div className="relative">
								<button
									onClick={() => setShowReactionPicker(!showReactionPicker)}
									className="bg-indigo-100 rounded-full p-1.5 hover:bg-indigo-200 transition-colors shadow-sm"
									aria-label="React"
								>
									<FaSmile className="w-3 h-3 text-indigo-400" />
								</button>

								{isMine
									? showReactionPicker && (
											<ReactionPicker
												onSelect={onToggleReaction}
												onClose={() => setShowReactionPicker(false)}
												className="right-10"
											/>
										)
									: showReactionPicker && (
											<ReactionPicker
												onSelect={onToggleReaction}
												onClose={() => setShowReactionPicker(false)}
												className="left-10"
											/>
										)}
							</div>

							{/* Copy Button */}
							{onCopy && (
								<button
									onClick={onCopy}
									className="bg-lime-100 rounded-full p-1.5 hover:bg-lime-200 transition-colors shadow-sm"
									aria-label="Copy"
								>
									<FaCopy className="w-3 h-3 text-lime-500" />
								</button>
							)}

							{/* Delete Button */}
							{isMine && onDelete && (
								<button
									onClick={onDelete}
									className="bg-rose-100 rounded-full p-1.5 hover:bg-rose-200 transition-colors shadow-sm"
									aria-label="Delete"
								>
									<FaTrash className="w-3 h-3 text-rose-600" />
								</button>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 mt-1 px-1">
						{showTimestamp && (
							<span className="text-xs text-neutral-400">
								{formatTime(message.createdAt)}
							</span>
						)}
						{isMine && <StatusIndicator status={message.status} />}
					</div>
				</div>
			</div>
		);
	}
);
MessageItem.displayName = 'MessageItem';

export default MessageItem;
