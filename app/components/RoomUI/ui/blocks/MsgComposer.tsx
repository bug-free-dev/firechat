'use client';

import React, { memo, useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

import { ReplyPreview } from '@/app/components/RoomUI/ui/atoms';
import type { CachedUser, ChatMessage } from '@/app/lib/types';

export interface MessageComposerProps {
	onSend: (text: string, replyTo?: string) => void;
	onTyping?: (typing: boolean) => void;
	disabled?: boolean;
	replyingTo?: ChatMessage;
	replyToSender?: CachedUser;
	onCancelReply?: () => void;
}

const MAX_HEIGHT = 150;
const TYPING_TIMEOUT = 2000;

const MessageComposer: React.FC<MessageComposerProps> = memo(
	({ onSend, onTyping, disabled = false, replyingTo, replyToSender, onCancelReply }) => {
		const [text, setText] = useState('');
		const [hasContent, setHasContent] = useState(false);
		const textareaRef = useRef<HTMLTextAreaElement | null>(null);
		const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
		const isTypingRef = useRef(false);
		const [isPending, startTransition] = useTransition();

		const handleSend = useCallback(() => {
			const textarea = textareaRef.current;
			if (!textarea) return;

			const value = textarea.value.trim();
			if (!value || disabled) return;

			const replyToId = replyingTo?.id;

			setText('');
			setHasContent(false);
			textarea.value = '';
			textarea.style.height = 'auto';

			if (isTypingRef.current) {
				isTypingRef.current = false;
				onTyping?.(false);
			}

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}

			startTransition(() => {
				onSend(value, replyToId);
			});

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

		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLTextAreaElement>) => {
				const newValue = e.target.value;
				const hasValue = newValue.trim().length > 0;

				if (text !== newValue) {
					setText(newValue);
				}
				if (hasContent !== hasValue) {
					setHasContent(hasValue);
				}

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

				if (hasValue && !isTypingRef.current) {
					isTypingRef.current = true;
					onTyping?.(true);
				}

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
			<div className="sticky bottom-0 z-50 bg-white dark:bg-neutral-900">
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
						{/* Input surface: adapts to light/dark, subtle border in light, muted in dark */}
						<div
							className="
								flex-1 relative rounded-2xl overflow-hidden
								border border-neutral-200 bg-white
								dark:border-neutral-700 dark:bg-neutral-800
								focus-within:ring focus-within:ring-neutral-800/10
								dark:focus-within:ring-neutral-200/10
								transition-colors
							"
						>
							<textarea
								ref={textareaRef}
								value={text}
								onChange={handleChange}
								onKeyDown={handleKeyDown}
								placeholder="message... (supports markdown)"
								rows={1}
								autoFocus
								disabled={disabled}
								className="
									w-full resize-none bg-transparent px-4 py-2 text-sm
									placeholder:text-neutral-400 dark:placeholder:text-neutral-500
									outline-none border-0 disabled:opacity-50 disabled:cursor-not-allowed
									text-neutral-900 dark:text-neutral-50
								"
								style={{
									height: 'auto',
								}}
							/>
						</div>

						<button
							onClick={handleSendClick}
							type="button"
							disabled={!hasContent || disabled || isPending}
							aria-label="Send message"
							className={`
								h-[44px] w-[44px] shrink-0 flex items-center justify-center
								rounded-2xl transition-transform duration-100 active:scale-95
								
								bg-neutral-900 text-white hover:bg-neutral-800
								disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed

								dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100
								dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400
							`}
						>
							<FaPaperPlane className="w-4 h-4" />
						</button>
					</div>

					<div className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
						Press Enter to send, Shift+Enter for new line.
					</div>
				</div>
			</div>
		);
	}
);

export default MessageComposer;
