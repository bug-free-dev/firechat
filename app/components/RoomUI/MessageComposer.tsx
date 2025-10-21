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
	const textRef = useRef(''); // always hold latest text for immediate reads
	const [isTyping, setIsTyping] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const typingTimeoutRef = useRef<number | null>(null);

	// update ref whenever state changes (and on input)
	useEffect(() => {
		textRef.current = text;
	}, [text]);

	// send logic: reads from textRef to avoid stale closures
	const handleSend = useCallback(() => {
		const value = (textRef.current ?? '').trim();
		if (!value || disabled) return;

		const replyToId = replyingTo?.id;
		// Clear immediately (optimistic UI)
		setText('');
		textRef.current = '';

		setIsTyping(false);
		onTyping?.(false);

		// call external send
		onSend(value, replyToId);

		// reset height and refocus input in next frames — helps mobile
		requestAnimationFrame(() => {
			if (!textareaRef.current) return;
			textareaRef.current.style.height = 'auto';
			// small delay improves reliability on iOS and some Android browsers
			setTimeout(() => {
				try {
					textareaRef.current?.focus({ preventScroll: true });
					// place caret at end
					const len = textareaRef.current?.value.length ?? 0;
					textareaRef.current?.setSelectionRange(len, len);
				} catch {
					// ignore focus exceptions
				}
			}, 50);
		});
	}, [onSend, onTyping, replyingTo, disabled]);

	// Use pointerdown on button to avoid focus-stealing on mobile
	const handleSendPointerDown = (e: React.PointerEvent) => {
		// prevent the button from taking focus (which hides keyboard)
		e.preventDefault();
		// then run send (this is still a user gesture)
		handleSend();
	};

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
			textRef.current = newValue;

			if (!isTyping && newValue.trim()) {
				setIsTyping(true);
				onTyping?.(true);
			}

			if (typingTimeoutRef.current) {
				window.clearTimeout(typingTimeoutRef.current);
			}
			typingTimeoutRef.current = window.setTimeout(() => {
				setIsTyping(false);
				onTyping?.(false);
				typingTimeoutRef.current = null;
			}, TYPING_TIMEOUT);
		},
		[isTyping, onTyping]
	);

	// auto-resize
	useEffect(() => {
		if (!textareaRef.current) return;
		const ta = textareaRef.current;
		ta.style.height = 'auto';
		const scrollHeight = ta.scrollHeight;
		if (scrollHeight > MAX_HEIGHT) {
			ta.style.height = `${MAX_HEIGHT}px`;
			ta.style.overflowY = 'auto';
		} else {
			ta.style.height = `${scrollHeight}px`;
			ta.style.overflowY = 'hidden';
		}
	}, [text]);

	// cleanup
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				window.clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
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
						onPointerDown={handleSendPointerDown}
						onClick={(e) => {
							e.preventDefault();
						}}
						type="button"
						disabled={!textRef.current.trim() || disabled}
						aria-label="Send message"
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
