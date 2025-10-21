'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiClipboard, FiCornerUpLeft, FiSmile, FiTrash2 } from 'react-icons/fi';

import { ChatMessage, FireCachedUser } from '@/app/lib/types';
import { formatTime } from '@/app/lib/utils/time';

import { FireAvatar } from '../UI';
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

const SWIPE_THRESHOLD = 40;
const MAX_SWIPE = 50;
const LONG_PRESS_TIME = 500;

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
	const [reactionAnchorRect, setReactionAnchorRect] = useState<DOMRect | null>(null);
	const [swipeOffset, setSwipeOffset] = useState(0);

	const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
	const longPressTimer = useRef<number | null>(null);
	const isDragging = useRef(false);
	const hasReplied = useRef(false);
	const autoHideTimer = useRef<number | null>(null);

	const bubbleRef = useRef<HTMLDivElement | null>(null);
	const reactionBtnRef = useRef<HTMLButtonElement | null>(null);
	const actionsRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (e: PointerEvent) => {
			const target = e.target as Node;
			if (
				!bubbleRef.current?.contains(target) &&
				!actionsRef.current?.contains(target) &&
				!reactionBtnRef.current?.contains(target)
			) {
				setShowActions(false);
				setShowReactionPicker(false);
			}
		};

		document.addEventListener('pointerdown', handleClickOutside);
		return () => document.removeEventListener('pointerdown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (showActions) {
			if (autoHideTimer.current) clearTimeout(autoHideTimer.current);

			autoHideTimer.current = window.setTimeout(() => {
				setShowActions(false);
			}, 2000);
		}

		return () => {
			if (autoHideTimer.current) {
				clearTimeout(autoHideTimer.current);
				autoHideTimer.current = null;
			}
		};
	}, [showActions]);

	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		if (!touch) return;

		touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
		isDragging.current = false;
		hasReplied.current = false;

		if (longPressTimer.current) clearTimeout(longPressTimer.current);

		longPressTimer.current = window.setTimeout(() => {
			const rect =
				reactionBtnRef.current?.getBoundingClientRect() ??
				bubbleRef.current?.getBoundingClientRect();
			setReactionAnchorRect(rect ?? null);
			setShowReactionPicker(true);
		}, LONG_PRESS_TIME);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!touchStart.current) return;

		const touch = e.touches[0];
		if (!touch) return;

		const deltaX = touch.clientX - touchStart.current.x;
		const deltaY = touch.clientY - touchStart.current.y;

		if (Math.abs(deltaY) > 10) {
			if (longPressTimer.current) {
				clearTimeout(longPressTimer.current);
				longPressTimer.current = null;
			}
			return;
		}

		if (Math.abs(deltaX) > 5) {
			isDragging.current = true;
			if (longPressTimer.current) {
				clearTimeout(longPressTimer.current);
				longPressTimer.current = null;
			}
		}

		if (deltaX > 0) {
			const progress = Math.min(deltaX / MAX_SWIPE, 1);
			const eased = deltaX * (1 - progress * 0.5);
			setSwipeOffset(Math.min(eased, MAX_SWIPE));
		}
	};

	const handleTouchEnd = () => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}

		if (swipeOffset > SWIPE_THRESHOLD && !hasReplied.current) {
			hasReplied.current = true;
			onReply();
		}

		setSwipeOffset(0);
		isDragging.current = false;
		touchStart.current = null;
	};

	const handleBubbleClick = () => {
		if (!isDragging.current) {
			setShowActions((s) => !s);
		}
	};

	const stopPropagation = (fn?: () => void) => (e: React.MouseEvent) => {
		e.stopPropagation();
		fn?.();
		setShowActions(false);
	};

	const handleCopy = useCallback(() => {
		if (!message.text) {
			toast.error('Nothing to copy');
			return;
		}
		onCopy?.();
	}, [message.text, onCopy]);

	const handleReactionBtn = (e: React.MouseEvent) => {
		e.stopPropagation();
		const rect =
			reactionBtnRef.current?.getBoundingClientRect() ??
			bubbleRef.current?.getBoundingClientRect();
		setReactionAnchorRect(rect ?? null);
		setShowReactionPicker((s) => !s);
		setShowActions(false);
	};

	return (
		<div
			className={`flex gap-3 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-4 transition-transform duration-200 ease-out`}
			style={{ transform: `translateX(${swipeOffset}px)` }}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onClick={handleBubbleClick}
		>
			{showAvatar ? (
				<FireAvatar seed={message.sender} size={28} src={avatarUrl} />
			) : (
				<div className="w-9 flex-shrink-0" />
			)}

			<div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
				{!isMine && displayName && showAvatar && (
					<div className="text-xs text-neutral-500 mb-1 px-1 font-medium">{displayName}</div>
				)}

				<div className="relative" ref={bubbleRef}>
					{showActions && (
						<div
							ref={actionsRef}
							className={`absolute bottom-5 fc-slide-in-left ${isMine ? 'right-5' : 'left-5'} flex gap-2 items-center`}
							style={{ transform: 'translateY(6px)' }}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={stopPropagation(onReply)}
								aria-label="Reply"
								className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
								type="button"
							>
								<FiCornerUpLeft size={14} />
							</button>

							<button
								ref={reactionBtnRef}
								onClick={handleReactionBtn}
								aria-label="React"
								className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
								type="button"
							>
								<FiSmile size={14} />
							</button>

							<button
								onClick={stopPropagation(handleCopy)}
								aria-label="Copy"
								className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
								type="button"
							>
								<FiClipboard size={14} />
							</button>

							{isMine && onDelete && (
								<button
									onClick={stopPropagation(onDelete)}
									aria-label="Delete"
									className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
									type="button"
								>
									<FiTrash2 size={14} />
								</button>
							)}
						</div>
					)}

					<div
						className={`rounded-2xl py-2 px-3 break-words transition-all duration-200 ${isMine ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-800'}`}
					>
						{message.replyTo && replyToMessage && (
							<ReplyPreview replyToMessage={replyToMessage} sender={replyToSender} compact />
						)}

						<MarkdownRenderer
							content={message.text}
							className={`text-sm sm:text-base ${isMine ? 'text-white' : 'text-neutral-800'}`}
						/>

						{message.reactions && (
							<ReactionsDisplay
								reactions={message.reactions}
								currentUserId={currentUserId}
								onToggle={onToggleReaction}
							/>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2 mt-1 px-1 text-xs text-neutral-400">
					{showTimestamp && <span>{formatTime(message.createdAt)}</span>}
					{isMine && <StatusIndicator status={message.status} />}
				</div>
			</div>

			{showReactionPicker && (
				<ReactionPicker
					anchorRect={reactionAnchorRect}
					onSelect={(emoji) => {
						onToggleReaction(emoji);
						setShowReactionPicker(false);
					}}
					onClose={() => setShowReactionPicker(false)}
				/>
			)}
		</div>
	);
};

export default MessageItem;
