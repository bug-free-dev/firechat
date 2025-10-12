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
	const MAX_HEIGHT = 250;

	const handleSend = useCallback(() => {
		if (!text.trim() || disabled) return;
		onSend(text.trim(), replyingTo?.id);
		setText('');
		setIsTyping(false);
		onTyping?.(false);
		if (textareaRef.current) textareaRef.current.style.height = 'auto';
		textareaRef.current?.focus();
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

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		setText(newValue);

		// Start typing
		if (!isTyping) {
			setIsTyping(true);
			onTyping?.(true);
		}

		// Reset typing after 2s of inactivity
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			setIsTyping(false);
			onTyping?.(false);
		}, 5000);
	};

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

	return (
		<div className="sticky bottom-0 z-50 bg-white px-4 sm:px-6 py-3 border-t border-neutral-200">
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

			<div className="flex items-end gap-2">
				<textarea
					ref={textareaRef}
					value={text}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder="Message... (supports markdown)"
					rows={2}
					disabled={disabled}
					className="flex-1 resize-none border-b-3 border-neutral-300 bg-neutral-100/60 focus:bg-neutral-100/35 focus:border-lime-400 px-3 py-2 text-sm placeholder:text-neutral-400 rounded-t-sm transition-all outline-none"
				/>

				<button
					onClick={handleSend}
					disabled={!text.trim() || disabled}
					className="w-12 h-13.5 flex items-center justify-center bg-lime-500 hover:bg-lime-600 disabled:bg-lime-200 text-white rounded-sm transition-all"
				>
					<FaPaperPlane className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};

export default MessageComposer;
