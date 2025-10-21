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

const SWIPE_THRESHOLD = 50;
const LONG_PRESS_DURATION = 500;
const ACTION_BUTTONS_AUTO_HIDE_DELAY = 2000; // 2 seconds

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
	// UI state
	const [showActions, setShowActions] = useState(false);
	const [showReactionPicker, setShowReactionPicker] = useState(false);
	const [reactionAnchorRect, setReactionAnchorRect] = useState<DOMRect | null>(null);
	const [swipeOffset, setSwipeOffset] = useState(0);

	// Drag / long-press
	const touchStartX = useRef<number | null>(null);
	const touchStartY = useRef<number | null>(null);
	const longPressTimeout = useRef<number | null>(null);
	const dragDistance = useRef(0);
	const isLongPress = useRef(false);
	const autoHideTimeout = useRef<number | null>(null);

	// Refs for DOM nodes
	const outerRef = useRef<HTMLDivElement | null>(null);
	const bubbleRef = useRef<HTMLDivElement | null>(null);
	const reactionBtnRef = useRef<HTMLButtonElement | null>(null);
	const actionsRef = useRef<HTMLDivElement | null>(null);

	// Auto-hide action buttons after 2 seconds
	useEffect(() => {
		if (showActions) {
			// Clear any existing timeout
			if (autoHideTimeout.current) {
				window.clearTimeout(autoHideTimeout.current);
			}

			// Set new timeout to hide after 2 seconds
			autoHideTimeout.current = window.setTimeout(() => {
				setShowActions(false);
			}, ACTION_BUTTONS_AUTO_HIDE_DELAY);
		}

		return () => {
			if (autoHideTimeout.current) {
				window.clearTimeout(autoHideTimeout.current);
				autoHideTimeout.current = null;
			}
		};
	}, [showActions]);

	// Close when clicking outside (action buttons or bubble)
	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			const target = e.target as Node;
			if (
				bubbleRef.current &&
				(bubbleRef.current.contains(target) ||
					actionsRef.current?.contains(target) ||
					reactionBtnRef.current?.contains(target))
			) {
				// click inside bubble or controls — do nothing
				return;
			}
			// else hide
			setShowActions(false);
			setShowReactionPicker(false);
		};

		document.addEventListener('pointerdown', handlePointerDown);
		return () => document.removeEventListener('pointerdown', handlePointerDown);
	}, []);

	// touch handlers — detect long press and swipe
	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0]?.clientX ?? null;
		touchStartY.current = e.touches[0]?.clientY ?? null;
		dragDistance.current = 0;
		isLongPress.current = false;
		if (longPressTimeout.current) {
			window.clearTimeout(longPressTimeout.current);
			longPressTimeout.current = null;
		}
		longPressTimeout.current = window.setTimeout(() => {
			isLongPress.current = true;
			// open reaction picker anchored to reaction button if present; fallback to bubble
			const rect =
				reactionBtnRef.current?.getBoundingClientRect() ??
				bubbleRef.current?.getBoundingClientRect() ??
				null;
			setReactionAnchorRect(rect);
			setShowReactionPicker(true);
		}, LONG_PRESS_DURATION);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (touchStartX.current === null) return;
		const currentX = e.touches[0]?.clientX;
		const currentY = e.touches[0]?.clientY;
		if (currentX === null || currentY === null) return;

		const deltaX = currentX - touchStartX.current;
		const deltaY = currentY - (touchStartY.current ?? 0);

		// if vertical scroll is significant, cancel long press
		if (Math.abs(deltaY) > 20) {
			if (longPressTimeout.current) {
				window.clearTimeout(longPressTimeout.current);
				longPressTimeout.current = null;
			}
			return;
		}

		dragDistance.current = deltaX;

		// Apply visual swipe offset (only positive swipes)
		if (deltaX > 0) {
			setSwipeOffset(Math.min(deltaX, SWIPE_THRESHOLD * 1.5));
		}
	};

	const handleTouchEnd = () => {
		if (longPressTimeout.current) {
			window.clearTimeout(longPressTimeout.current);
			longPressTimeout.current = null;
		}

		// swipe-to-reply
		if (
			!isLongPress.current &&
			Math.abs(dragDistance.current) > SWIPE_THRESHOLD &&
			dragDistance.current > 0
		) {
			onReply();
		}

		// Reset swipe offset with animation
		setSwipeOffset(0);

		dragDistance.current = 0;
		isLongPress.current = false;
		touchStartX.current = null;
		touchStartY.current = null;
	};

	// Click on bubble toggles action buttons (but not when dragging or after long-press)
	const handleBubbleClick = () => {
		if (Math.abs(dragDistance.current) > 10) return;
		if (isLongPress.current) return;
		setShowActions((s) => !s);
	};

	// Action button clicks must not propagate (so they don't toggle showActions)
	const stopAnd = (fn?: () => void) => (e: React.MouseEvent) => {
		e.stopPropagation();
		fn?.();
		// after action performed, hide actions (except when opening reaction picker)
		setShowActions(false);
	};

	const handleCopy = useCallback(() => {
		// executed via stopAnd wrapper
		if (!message.text) {
			toast.error('Nothing to copy');
			return;
		}
		onCopy?.();
	}, [message.text, onCopy]);

	const handleReactionBtn = (e: React.MouseEvent) => {
		e.stopPropagation();
		// anchor to the button
		const rect =
			reactionBtnRef.current?.getBoundingClientRect() ??
			bubbleRef.current?.getBoundingClientRect() ??
			null;
		setReactionAnchorRect(rect);
		setShowReactionPicker((s) => !s);
		// keep actions visible while reaction picker open (optional)
		setShowActions(false);
	};

	// select reaction from picker
	const handleSelectReaction = (emoji: string) => {
		onToggleReaction(emoji);
	};

	// delete/copy/reply handlers — wrapped to stop propagation
	const handleReplyClick = stopAnd(onReply);
	const handleCopyClick = stopAnd(handleCopy);
	const handleDeleteClick = stopAnd(onDelete ? onDelete : undefined);

	return (
		<div
			ref={outerRef}
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
					{/* Action Buttons (shown only when toggled) */}
					{showActions && (
						<div
							ref={actionsRef}
							className={` absolute top-full fc-slide-in-left ${isMine ? 'right-5' : 'left-5'} flex gap-2 items-center`}
							style={{ transform: 'translateY(6px)' }}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={handleReplyClick}
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
								onClick={handleCopyClick}
								aria-label="Copy"
								className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
								type="button"
							>
								<FiClipboard size={14} />
							</button>

							{isMine && onDelete && (
								<button
									onClick={handleDeleteClick}
									aria-label="Delete"
									className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
									type="button"
								>
									<FiTrash2 size={14} />
								</button>
							)}
						</div>
					)}

					{/* Message bubble */}
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

			{/* Reaction picker as a fixed element anchored to reaction button */}
			{showReactionPicker && (
				<ReactionPicker
					anchorRect={reactionAnchorRect}
					onSelect={handleSelectReaction}
					onClose={() => setShowReactionPicker(false)}
				/>
			)}
		</div>
	);
};

export default MessageItem;
