'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiCornerUpLeft } from 'react-icons/fi';

import { ACTION_AUTO_HIDE_MS, LONG_PRESS_DURATION } from '@/app/components/RoomUI/constants';
import { useLongPress } from '@/app/components/RoomUI/hooks/useLongPress';
import { useSwipeReply } from '@/app/components/RoomUI/hooks/useSwipeReply';
import {
	MsgActions,
	MsgBubble,
	ReactionsBadge,
	ReactionsPicker,
	ReplyPreview,
} from '@/app/components/RoomUI/ui/atoms';
import Markdown from '@/app/components/RoomUI/ui/renderer/Markdown';
import { FireAvatar } from '@/app/components/UI';
import type { CachedUser, ChatMessage } from '@/app/lib/types';
import { formatTime } from '@/app/lib/utils/time';

interface MsgItemProps {
	message: ChatMessage;
	isMine: boolean;
	showAvatar?: boolean;
	displayName?: string;
	avatarUrl?: string | null;
	replyToMessage?: ChatMessage;
	replyToSender?: CachedUser;
	currentUserId: string;
	onReply: () => void;
	onToggleReaction: (emoji: string) => void;
	onDelete?: () => void;
	onCopy?: () => void;
}

const MsgItem: React.FC<MsgItemProps> = memo(
	({
		message,
		isMine,
		showAvatar = true,
		displayName,
		avatarUrl,
		replyToMessage,
		replyToSender,
		currentUserId,
		onReply,
		onToggleReaction,
		onDelete,
		onCopy,
	}) => {
		const [showActions, setShowActions] = useState(false);
		const [showReactionPicker, setShowReactionPicker] = useState(false);
		const [reactionAnchorRect, setReactionAnchorRect] = useState<DOMRect | null>(null);
		const [copied, setCopied] = useState(false);
		const [showThemeSelector, setShowThemeSelector] = useState(false);

		const bubbleRef = useRef<HTMLDivElement | null>(null);
		const actionsRef = useRef<HTMLDivElement | null>(null);
		const autoHideTimer = useRef<number | null>(null);
		const wasSwiping = useRef(false);

		const { swipeOffset, handleTouchStart, handleTouchMove, handleTouchEnd } =
			useSwipeReply(onReply);

		const { start: startLongPress, cancel: cancelLongPress } = useLongPress(() => {
			const rect = bubbleRef.current?.getBoundingClientRect();
			setReactionAnchorRect(rect ?? null);
			setShowReactionPicker(true);
		}, LONG_PRESS_DURATION);

		// Click outside to close
		useEffect(() => {
			const handleClickOutside = (e: PointerEvent) => {
				const target = e.target as Node;
				if (!bubbleRef.current?.contains(target) && !actionsRef.current?.contains(target)) {
					setShowActions(false);
					setShowReactionPicker(false);
					setShowThemeSelector(false);
				}
			};
			document.addEventListener('pointerdown', handleClickOutside);
			return () => document.removeEventListener('pointerdown', handleClickOutside);
		}, []);

		// Auto-hide actions
		useEffect(() => {
			if (showActions) {
				if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
				autoHideTimer.current = window.setTimeout(
					() => setShowActions(false),
					ACTION_AUTO_HIDE_MS
				) as unknown as number;
			}
			return () => {
				if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
			};
		}, [showActions]);

		const onTouchStart = useCallback(
			(e: React.TouchEvent) => {
				wasSwiping.current = false;
				startLongPress();
				handleTouchStart(e);
			},
			[handleTouchStart, startLongPress]
		);

		const onTouchMove = useCallback(
			(e: React.TouchEvent) => {
				const touch = e.touches[0];
				if (touch) {
					cancelLongPress();
					if (Math.abs(swipeOffset) > 10) wasSwiping.current = true;
				}
				handleTouchMove(e);
			},
			[handleTouchMove, cancelLongPress, swipeOffset]
		);

		const onTouchEnd = useCallback(() => {
			cancelLongPress();
			handleTouchEnd();
			setTimeout(() => (wasSwiping.current = false), 100);
		}, [handleTouchEnd, cancelLongPress]);

		const handleBubbleClick = useCallback(() => {
			if (!wasSwiping.current) setShowActions((s) => !s);
		}, []);

		const handleCopy = useCallback(() => {
			if (!message.text) {
				toast.error('Nothing to copy');
				return;
			}
			onCopy?.();
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}, [message.text, onCopy]);

		const handleOpenReactions = useCallback((e?: React.MouseEvent) => {
			e?.stopPropagation();
			const rect = bubbleRef.current?.getBoundingClientRect();
			setReactionAnchorRect(rect ?? null);
			setShowReactionPicker((s) => !s);
			setShowActions(false);
		}, []);

		const replyIconOpacity = Math.min(swipeOffset / 70, 1);
		const replyIconScale = 0.7 + (swipeOffset / 70) * 0.3;
		const showReplyIcon = swipeOffset > 15;

		return (
			<div
				className={`flex gap-3 items-end z-0 ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-1`}
				style={{
					transform: `translateX(${swipeOffset}px)`,
					transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
				}}
				onTouchStart={onTouchStart}
				onTouchMove={onTouchMove}
				onTouchEnd={onTouchEnd}
				onClick={handleBubbleClick}
			>
				{showReplyIcon && (
					<div
						className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
						style={{
							opacity: replyIconOpacity,
							transform: `translateY(-50%) scale(${replyIconScale})`,
						}}
					>
						<FiCornerUpLeft
							size={20}
							className={swipeOffset >= 70 ? 'text-blue-400' : 'text-neutral-400'}
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
						<div className="text-xs text-neutral-500 mb-1 px-1 font-medium">
							{displayName}
						</div>
					)}

					<div className="relative" ref={bubbleRef}>
						{showActions && (
							<div ref={actionsRef}>
								<MsgActions
									onReply={onReply}
									onOpenReactions={handleOpenReactions}
									onCopy={handleCopy}
									onThemeToggle={() => setShowThemeSelector((s) => !s)}
									onDelete={onDelete}
									copied={copied}
									isMine={isMine}
								/>
							</div>
						)}

						<MsgBubble
							isMine={isMine}
							status={message.status}
							timestamp={formatTime(message.createdAt)}
						>
							{message.replyTo && replyToMessage && (
								<ReplyPreview
									replyToMessage={replyToMessage}
									sender={replyToSender}
									compact
								/>
							)}

							<Markdown
								content={message.text}
								className={`text-sm sm:text-base z-0 ${isMine ? 'text-white' : 'text-neutral-800'}`}
								showThemeSelector={showThemeSelector}
							/>
						</MsgBubble>

						{message.reactions && (
							<div className="mt-1">
								<ReactionsBadge
									reactions={message.reactions}
									currentUserId={currentUserId}
									onToggle={onToggleReaction}
								/>
							</div>
						)}
					</div>
				</div>

				{showReactionPicker && (
					<ReactionsPicker
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
	}
);

export default MsgItem;
