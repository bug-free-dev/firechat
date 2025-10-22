'use client';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

import { ChatMessage, FireCachedUser } from '@/app/lib/types';

import ReplyPreview from './ReplyPreview';

export interface MessageComposerProps {
	onSend: (text: string, replyTo?: string) => void;
	onTyping?: (typing: boolean) => void;
	disabled?: boolean;
	replyingTo?: ChatMessage;
	replyToSender?: FireCachedUser;
	onCancelReply?: () => void;
}

const MAX_HEIGHT = 150;
const TYPING_TIMEOUT = 2000;

const MessageComposer: React.FC<MessageComposerProps> = React.memo(
	({ onSend, onTyping, disabled = false, replyingTo, replyToSender, onCancelReply }) => {
		const [text, setText] = useState('');
		const [hasContent, setHasContent] = useState(false);
		const textareaRef = useRef<HTMLTextAreaElement | null>(null);
		const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
		const isTypingRef = useRef(false);
		const [isPending, startTransition] = useTransition();

		// Optimized send handler - no refs needed for text
		const handleSend = useCallback(() => {
			const textarea = textareaRef.current;
			if (!textarea) return;

			const value = textarea.value.trim();
			if (!value || disabled) return;

			const replyToId = replyingTo?.id;

			// Clear state immediately for instant UI feedback
			setText('');
			setHasContent(false);
			textarea.value = '';
			textarea.style.height = 'auto';

			// Stop typing indicator
			if (isTypingRef.current) {
				isTypingRef.current = false;
				onTyping?.(false);
			}

			// Clear typing timeout
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}

			// Send in transition to avoid blocking UI
			startTransition(() => {
				onSend(value, replyToId);
			});

			// Keep focus
			textarea.focus();
		}, [onSend, onTyping, replyingTo, disabled]);

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					handleSend();
				}
			},
			[handleSend]
		);

		// Optimized change handler - direct DOM manipulation for height
		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLTextAreaElement>) => {
				const newValue = e.target.value;
				const hasValue = newValue.trim().length > 0;

				// Update state only when necessary
				if (text !== newValue) {
					setText(newValue);
				}
				if (hasContent !== hasValue) {
					setHasContent(hasValue);
				}

				// Direct height update without state
				const ta = e.target;
				ta.style.height = 'auto';
				const scrollHeight = ta.scrollHeight;
				if (scrollHeight > MAX_HEIGHT) {
					ta.style.height = `${MAX_HEIGHT}px`;
					ta.style.overflowY = 'auto';
				} else {
					ta.style.height = `${scrollHeight}px`;
					ta.style.overflowY = 'hidden';
				}

				// Typing indicator logic
				if (hasValue && !isTypingRef.current) {
					isTypingRef.current = true;
					onTyping?.(true);
				}

				// Debounce typing indicator off
				if (typingTimeoutRef.current) {
					clearTimeout(typingTimeoutRef.current);
				}
				typingTimeoutRef.current = setTimeout(() => {
					isTypingRef.current = false;
					onTyping?.(false);
					typingTimeoutRef.current = null;
				}, TYPING_TIMEOUT);
			},
			[text, hasContent, onTyping]
		);

		// Cleanup
		useEffect(() => {
			return () => {
				if (typingTimeoutRef.current) {
					clearTimeout(typingTimeoutRef.current);
				}
			};
		}, []);

		const handleSendClick = useCallback(
			(e: React.MouseEvent) => {
				e.preventDefault();
				handleSend();
			},
			[handleSend]
		);

		return (
			<div className="sticky bottom-0 z-50 bg-white border-t border-neutral-200">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
					{replyingTo && (
						<div className="mb-2">
							<ReplyPreview
								replyToMessage={replyingTo}
								sender={replyToSender}
								onCancel={onCancelReply}
								compact
							/>
						</div>
					)}

					<div className="flex items-end gap-3">
						<textarea
							ref={textareaRef}
							value={text}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							placeholder="message... (supports markdown)"
							rows={1}
							autoFocus
							disabled={disabled}
							className="flex-1 resize-none border border-neutral-200 bg-white focus:bg-white focus:ring-2 focus:ring-neutral-900/10 px-4 py-3 text-sm placeholder:text-neutral-400 rounded-lg transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed will-change-contents"
							style={{ height: 'auto' }}
						/>

						<button
							onClick={handleSendClick}
							type="button"
							disabled={!hasContent || disabled || isPending}
							aria-label="Send message"
							className="h-[44px] w-[44px] shrink-0 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white rounded-lg transition-transform duration-100"
						>
							<FaPaperPlane className="w-4 h-4" />
						</button>
					</div>

					<div className="mt-2 text-xs text-neutral-400">
						Press Enter to send, Shift+Enter for new line.
					</div>
				</div>
			</div>
		);
	}
);

export default MessageComposer;