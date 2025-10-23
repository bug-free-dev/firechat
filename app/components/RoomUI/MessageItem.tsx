'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiCheckCircle, FiClipboard, FiCornerUpLeft, FiSmile, FiTrash2 } from 'react-icons/fi';
import { IoColorPaletteOutline } from 'react-icons/io5';

import { useSwipeReply } from '@/app/lib/hooks/useSwipe';
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

const SWIPE_TRIGGER_THRESHOLD = 70; // Trigger reply at 70px
const LONG_PRESS_DURATION = 500;
const ACTION_AUTO_HIDE_MS = 3000;

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
	const [copied, setCopied] = useState(false);
	const [showThemeSelector, setShowThemeSelector] = useState(false);

	// Local refs for UI behavior
	const bubbleRef = useRef<HTMLDivElement | null>(null);
	const reactionBtnRef = useRef<HTMLButtonElement | null>(null);
	const actionsRef = useRef<HTMLDivElement | null>(null);

	// keep auto-hide timer for actions
	const autoHideTimer = useRef<number | null>(null);

	// track brief swipe activity to prevent click toggles
	const wasSwiping = useRef(false);

	// local touch start/local long press handling (we keep this for reaction long-press)
	const touchStartLocal = useRef<{ x: number; y: number; time: number } | null>(null);
	const longPressTimer = useRef<number | null>(null);

	// Use the external hook for swipe-to-reply behavior
	const {
		swipeOffset,
		handleTouchStart: hookTouchStart,
		handleTouchMove: hookTouchMove,
		handleTouchEnd: hookTouchEnd,
	} = useSwipeReply(onReply);

	// Click outside handler
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
				setShowThemeSelector(false);
			}
		};

		document.addEventListener('pointerdown', handleClickOutside);
		return () => document.removeEventListener('pointerdown', handleClickOutside);
	}, []);

	// Auto-hide actions after delay
	useEffect(() => {
		if (showActions) {
			if (autoHideTimer.current) clearTimeout(autoHideTimer.current);

			autoHideTimer.current = window.setTimeout(() => {
				setShowActions(false);
			}, ACTION_AUTO_HIDE_MS);
		}

		return () => {
			if (autoHideTimer.current) {
				clearTimeout(autoHideTimer.current);
				autoHideTimer.current = null;
			}
		};
	}, [showActions]);

	// Wrapper handlers that integrate the hook and keep local long-press behavior
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const touch = e.touches[0];
			if (!touch) return;

			// local tracking for long press
			touchStartLocal.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
			wasSwiping.current = false;

			if (longPressTimer.current) clearTimeout(longPressTimer.current);

			longPressTimer.current = window.setTimeout(() => {
				// only open reaction picker if user hasn't started swiping
				const rect = bubbleRef.current?.getBoundingClientRect();
				setReactionAnchorRect(rect ?? null);
				setShowReactionPicker(true);
				if ('vibrate' in navigator) {
					navigator.vibrate(50);
				}
			}, LONG_PRESS_DURATION);

			// call hook's touch start
			hookTouchStart(e);
		},
		[hookTouchStart]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			const touch = e.touches[0];
			if (touch && touchStartLocal.current) {
				const deltaX = touch.clientX - touchStartLocal.current.x;
				const deltaY = touch.clientY - touchStartLocal.current.y;

				// Cancel long press if moved vertically or horizontally beyond small threshold
				if (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10) {
					if (longPressTimer.current) {
						clearTimeout(longPressTimer.current);
						longPressTimer.current = null;
					}
				}

				// Mark that user was swiping if horizontal move is significant
				if (Math.abs(deltaX) > 10) {
					wasSwiping.current = true;
				}
			}

			// call hook's touch move to handle swipeOffset state
			hookTouchMove(e);
		},
		[hookTouchMove]
	);

	const handleTouchEnd = useCallback(() => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}

		// call hook's touch end which triggers onReply if threshold met
		hookTouchEnd();

		// Reset local tracking after a brief delay to prevent click from firing immediately after swipe
		setTimeout(() => {
			wasSwiping.current = false;
		}, 100);

		touchStartLocal.current = null;
	}, [hookTouchEnd]);

	const handleBubbleClick = useCallback(() => {
		// Don't toggle actions if user was just swiping
		if (!wasSwiping.current) {
			setShowActions((s) => !s);
		}
	}, []);

	const stopPropagation = useCallback(
		(fn?: () => void) => (e: React.MouseEvent) => {
			e.stopPropagation();
			fn?.();
			setShowActions(false);
		},
		[]
	);

	const handleCopy = useCallback(() => {
		if (!message.text) {
			toast.error('Nothing to copy');
			return;
		}
		onCopy?.();
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [message.text, onCopy]);

	const handleReactionBtn = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		const rect = bubbleRef.current?.getBoundingClientRect();
		setReactionAnchorRect(rect ?? null);
		setShowReactionPicker((s) => !s);
		setShowActions(false);
	}, []);

	const handleThemeToggle = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setShowThemeSelector((s) => !s);
	}, []);

	// Calculate reply icon opacity and scale based on swipe progress
	const replyIconOpacity = Math.min(swipeOffset / SWIPE_TRIGGER_THRESHOLD, 1);
	const replyIconScale = Math.min(0.7 + (swipeOffset / SWIPE_TRIGGER_THRESHOLD) * 0.3, 1);
	const showReplyIcon = swipeOffset > 20;

	return (
		<div
			className={`flex gap-3 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-1 transition-transform duration-200 ease-out relative z-0`}
			style={{ transform: `translateX(${swipeOffset}px)` }}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onClick={handleBubbleClick}
		>
			{/* Reply icon indicator during swipe */}
			{showReplyIcon && (
				<div
					className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
					style={{
						opacity: replyIconOpacity,
						transform: `translateY(-50%) scale(${replyIconScale})`,
						transition: 'opacity 0.1s, transform 0.1s',
					}}
				>
					<FiCornerUpLeft
						size={20}
						className={`${swipeOffset >= SWIPE_TRIGGER_THRESHOLD ? 'text-blue-600' : 'text-neutral-400'}`}
					/>
				</div>
			)}

			{showAvatar ? (
				<FireAvatar seed={message.sender} size={28} src={avatarUrl} />
			) : (
				<div className="w-7 flex-shrink-0" />
			)}

			<div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
				{!isMine && displayName && showAvatar && (
					<div className="text-xs text-neutral-500 mb-1 px-1 font-medium">{displayName}</div>
				)}

				<div className="relative" ref={bubbleRef}>
					{/* Compact action buttons */}
					{showActions && (
						<div
							ref={actionsRef}
							className={`absolute bottom-3 ${isMine ? 'right-2' : 'left-2'} flex gap-1 items-center bg-white rounded-xl shadow-lg border border-neutral-200 p-1 z-[100] fc-slide-in-left duration-150`}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={stopPropagation(onReply)}
								aria-label="Reply"
								className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
								type="button"
								title="Reply"
							>
								<FiCornerUpLeft size={15} />
							</button>

							<button
								ref={reactionBtnRef}
								onClick={handleReactionBtn}
								aria-label="React"
								className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors"
								type="button"
								title="React"
							>
								<FiSmile size={15} />
							</button>

							<button
								onClick={stopPropagation(handleCopy)}
								aria-label="Copy"
								className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
								type="button"
								title="Copy message"
							>
								{copied ? <FiCheckCircle size={15} /> : <FiClipboard size={15} />}
							</button>

							<button
								onClick={handleThemeToggle}
								aria-label="Change theme"
								className="p-1.5 rounded hover:bg-orange-50 text-orange-600 transition-colors"
								type="button"
								title="Syntax theme"
							>
								<IoColorPaletteOutline size={15} />
							</button>

							{isMine && onDelete && (
								<button
									onClick={stopPropagation(onDelete)}
									aria-label="Delete"
									className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
									type="button"
									title="Delete message"
								>
									<FiTrash2 size={15} />
								</button>
							)}
						</div>
					)}

					{/* Message bubble */}
					<div
						className={`rounded-2xl max-w-65 py-1 px-3 break-words transition-all duration-150 z-0 ${isMine ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-800'}`}
					>
						{message.replyTo && replyToMessage && (
							<ReplyPreview replyToMessage={replyToMessage} sender={replyToSender} compact />
						)}

						<MarkdownRenderer
							content={message.text}
							className={`text-sm sm:text-base ${isMine ? 'text-white' : 'text-neutral-800'}`}
							showThemeSelector={showThemeSelector}
							onThemeSelectorClose={() => setShowThemeSelector(false)}
						/>
					</div>

					{/* Reactions */}
					{message.reactions && (
						<ReactionsDisplay
							reactions={message.reactions}
							currentUserId={currentUserId}
							onToggle={onToggleReaction}
						/>
					)}
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

export default React.memo(MessageItem);
