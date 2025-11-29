'use client';

import React, { memo, useMemo } from 'react';
import { FaReply, FaTimes } from 'react-icons/fa';

import type { CachedUser, ChatMessage } from '@/app/lib/types';

export interface ReplyPreviewProps {
	replyToMessage?: ChatMessage;
	sender?: CachedUser;
	onCancel?: () => void;
	compact?: boolean;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = memo(
	({ replyToMessage, sender, onCancel, compact = true }) => {
		const truncateText = (text: string, maxLength: number = 80): string => {
			if (text.length <= maxLength) return text;
			return text.slice(0, maxLength).trim() + '…';
		};

		const displayText = useMemo(() => {
			if (!replyToMessage?.text) return '';
			return truncateText(replyToMessage.text, compact ? 50 : 80);
		}, [replyToMessage?.text, compact]);

		if (!replyToMessage) return null;

		return (
			<div
				className={`
					mt-1 flex items-start gap-2 
					${compact ? 'text-xs' : 'text-sm'} 
					p-2 rounded relative overflow-hidden
					bg-neutral-50 backdrop-blur-sm border-l-4 border-blue-400
					shadow-sm
					dark:bg-zinc-900/70 dark:border-cyan-500
					${compact ? 'mb-1' : 'mb-2'}
				`}
			>
				<FaReply
					className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-blue-500 dark:text-cyan-400 mt-0.5 flex-shrink-0`}
				/>
				<div className="flex-1 min-w-0">
					<div
						className={`font-semibold truncate ${compact ? 'text-xs' : 'text-sm'} 
						text-neutral-800 dark:text-neutral-100`}
					>
						@{sender?.usernamey ?? 'Unknown'}
					</div>
					<div
						className={`mt-0.5 ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'} 
						text-neutral-600 dark:text-neutral-300`}
					>
						{displayText}
					</div>
				</div>
				{onCancel && (
					<button
						onClick={onCancel}
						className="text-neutral-400 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100 transition-colors duration-150 flex-shrink-0"
						aria-label="Cancel reply"
					>
						<FaTimes className="w-3 h-3" />
					</button>
				)}
			</div>
		);
	}
);

export default ReplyPreview;
