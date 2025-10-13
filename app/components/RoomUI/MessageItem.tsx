'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChatMessage, FireCachedUser } from '@/app/lib/types';
import { formatTime } from '@/app/lib/utils/time';
import FireAvatar from '../UI/FireAvatar';
import { FiCornerUpLeft, FiSmile, FiClipboard, FiTrash2 } from 'react-icons/fi';
import MarkdownRenderer from './MarkdownRenderer';
import ReactionPicker from './ReactionPicker';
import ReactionsDisplay from './ReactionsDisplay';
import ReplyPreview from './ReplyPreview';
import StatusIndicator from './StatusIndicator';
import { toast } from 'react-hot-toast';

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

const SWIPE_THRESHOLD = 50;
const LONG_PRESS_DURATION = 500;

const MessageItem: React.FC<MessageItemProps> = ({
	message,
	isMine,
	showAvatar = true,
	showTimestamp = true,
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
	const [showActions, setShowActions] = useState(false);
	const [showReactionPicker, setShowReactionPicker] = useState(false);
	const [dragX, setDragX] = useState(0);
	const [isLongPress, setIsLongPress] = useState(false);

	const touchStartX = useRef<number | null>(null);
	const touchStartY = useRef<number | null>(null);
	const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
	const dragDistance = useRef(0);

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0]?.clientX ?? null;
		touchStartY.current = e.touches[0]?.clientY ?? null;
		dragDistance.current = 0;
		setIsLongPress(false);

		longPressTimeout.current = setTimeout(() => {
			setIsLongPress(true);
			setShowReactionPicker(true);
		}, LONG_PRESS_DURATION);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (touchStartX.current === null) return;

		const currentX = e.touches[0]?.clientX;
		const currentY = e.touches[0]?.clientY;

		if (!currentX || !currentY) return;

		const deltaX = currentX - touchStartX.current;
		const deltaY = currentY - (touchStartY.current ?? 0);

		if (Math.abs(deltaY) > 50) {
			if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
			return;
		}

		dragDistance.current = deltaX;
		setDragX(deltaX > 0 ? Math.min(deltaX, 70) : 0);
	};

	const handleTouchEnd = () => {
		if (longPressTimeout.current) clearTimeout(longPressTimeout.current);

		if (!isLongPress && dragDistance.current > SWIPE_THRESHOLD) {
			onReply();
		}

		setDragX(0);
		setIsLongPress(false);
		touchStartX.current = null;
		touchStartY.current = null;
		dragDistance.current = 0;
	};

	const handleMouseEnter = () => setShowActions(true);
	const handleMouseLeave = () => {
		setShowActions(false);
		setShowReactionPicker(false);
	};

	const handleClickActions = () => {
		if (typeof window !== 'undefined' && window.innerWidth <= 768) {
			setShowActions((prev) => !prev);
		}
	};

	const handleCopy = useCallback(() => {
		if (!message.text) {
			toast.error('Nothing to copy');
			return;
		}
		onCopy?.();
		setShowActions(false);
	}, [message.text, onCopy]);

	const handleReactionClick = () => {
		setShowReactionPicker((prev) => !prev);
	};

	return (
		<div
			className={`flex gap-3 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-4`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onClick={handleClickActions}
			style={{
				transform: `translateX(${dragX}px)`,
				transition: dragX === 0 ? 'transform 0.2s ease-out' : 'none',
			}}
		>
			{/* Avatar */}
			{showAvatar ? (
				<FireAvatar seed={message.sender} size={28} src={avatarUrl} />
			) : (
				<div className="w-9 flex-shrink-0" />
			)}

			<div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
				{/* Display Name */}
				{!isMine && displayName && showAvatar && (
					<div className="text-xs text-neutral-500 mb-1 px-1 font-medium">{displayName}</div>
				)}

				{/* Bubble Container */}
				<div className="relative group">
					{/* Action Buttons */}
					{showActions && (
						<div
							className={`absolute fc-slide-in-left transition-all ${
								isMine ? 'right-full pr-2' : 'left-full pl-2'
							} bottom-0 flex gap-2 items-center duration-300`}
						>
							<button
								onClick={onReply}
								className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors duration-150"
								aria-label="Reply"
								type="button"
							>
								<FiCornerUpLeft size={16} />
							</button>
							<button
								onClick={handleReactionClick}
								className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors duration-150"
								aria-label="React"
								type="button"
							>
								<FiSmile size={16} />
							</button>
							<button
								onClick={handleCopy}
								className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors duration-150"
								aria-label="Copy"
								type="button"
							>
								<FiClipboard size={16} />
							</button>
							{isMine && onDelete && (
								<button
									onClick={onDelete}
									className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors duration-150"
									aria-label="Delete"
									type="button"
								>
									<FiTrash2 size={16} />
								</button>
							)}
						</div>
					)}

					{/* Message Bubble */}
					<div
						className={`rounded-2xl py-2 px-3 break-words transition-all duration-200 ${
							isMine
								? 'bg-neutral-900 text-white'
								: 'bg-white border border-neutral-200 text-neutral-800'
						}`}
					>
						{/* Reply Preview */}
						{message.replyTo && replyToMessage && (
							<ReplyPreview replyToMessage={replyToMessage} sender={replyToSender} compact />
						)}

						{/* Message Content */}
						<MarkdownRenderer
							content={message.text}
							className={`text-sm sm:text-base ${isMine ? 'text-white' : 'text-neutral-800'}`}
						/>

						{/* Reactions */}
						{message.reactions && (
							<ReactionsDisplay
								reactions={message.reactions}
								currentUserId={currentUserId}
								onToggle={onToggleReaction}
							/>
						)}
					</div>

					{/* Reaction Picker */}
					{showReactionPicker && (
						<ReactionPicker
							onSelect={onToggleReaction}
							onClose={() => setShowReactionPicker(false)}
							className={isMine ? 'right-0' : 'left-0'}
						/>
					)}
				</div>

				{/* Timestamp & Status */}
				<div className="flex items-center gap-2 mt-1 px-1 text-xs text-neutral-400">
					{showTimestamp && <span>{formatTime(message.createdAt)}</span>}
					{isMine && <StatusIndicator status={message.status} />}
				</div>
			</div>
		</div>
	);
};

export default MessageItem;
