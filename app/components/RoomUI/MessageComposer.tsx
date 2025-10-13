'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const MessageComposer: React.FC<MessageComposerProps> = ({
	onSend,
	onTyping,
	disabled = false,
	replyingTo,
	replyToSender,
	onCancelReply,
}) => {
	const [text, setText] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleSend = useCallback(() => {
		if (!text.trim() || disabled) return;

		onSend(text.trim(), replyingTo?.id);
		setText('');
		setIsTyping(false);
		onTyping?.(false);

		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.focus();
		}
	}, [text, disabled, onSend, replyingTo, onTyping]);

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
			setText(newValue);

			if (!isTyping) {
				setIsTyping(true);
				onTyping?.(true);
			}

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			typingTimeoutRef.current = setTimeout(() => {
				setIsTyping(false);
				onTyping?.(false);
			}, TYPING_TIMEOUT);
		},
		[isTyping, onTyping]
	);

	useEffect(() => {
		if (!textareaRef.current) return;

		textareaRef.current.style.height = 'auto';
		const scrollHeight = textareaRef.current.scrollHeight;

		if (scrollHeight > MAX_HEIGHT) {
			textareaRef.current.style.height = `${MAX_HEIGHT}px`;
			textareaRef.current.style.overflowY = 'auto';
		} else {
			textareaRef.current.style.height = `${scrollHeight}px`;
			textareaRef.current.style.overflowY = 'hidden';
		}
	}, [text]);

	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, []);

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
						className="flex-1 resize-none border border-neutral-200 bg-white focus:bg-white focus:ring-2 focus:ring-neutral-900/10 px-4 py-3 text-sm placeholder:text-neutral-400 rounded-lg transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
					/>

					<button
						onClick={handleSend}
						disabled={!text.trim() || disabled}
						className="h-[44px] w-[44px] flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-150"
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
};

export default React.memo(MessageComposer);
