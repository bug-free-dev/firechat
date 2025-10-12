'use client';

import { FaReply, FaTimes } from 'react-icons/fa';

import { ChatMessage, FireCachedUser } from '@/app/lib/types';

export interface ReplyPreviewProps {
	replyToMessage?: ChatMessage;
	sender?: FireCachedUser;
	onCancel?: () => void;
	compact?: boolean;
}

const truncateText = (text: string, maxLength: number = 80) => {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trim() + '...';
};

// Define a palette of 5 nice saturated colors
const colors = [
	{ from: 'from-lime-50', to: 'to-lime-100', border: 'border-l-lime-300', icon: 'text-lime-400' },
	{
		from: 'from-yellow-50',
		to: 'to-yellow-100',
		border: 'border-l-yellow-300',
		icon: 'text-yellow-400',
	},
	{ from: 'from-rose-50', to: 'to-rose-100', border: 'border-l-rose-300', icon: 'text-rose-400' },
	{ from: 'from-blue-50', to: 'to-blue-100', border: 'border-l-blue-300', icon: 'text-blue-400' },
	{ from: 'from-rose-50', to: 'to-rose-100', border: 'border-l-rose-300', icon: 'text-rose-400' },
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const ReplyPreview: React.FC<ReplyPreviewProps> = ({
	replyToMessage,
	sender,
	onCancel,
	compact,
}) => {
	if (!replyToMessage) return null;

	const displayText = truncateText(replyToMessage.text, compact ? 50 : 80);
	const color = getRandomColor();

	return (
		<div
			className={`flex items-start gap-2 ${compact ? 'text-xs mb-1' : 'text-sm'} 
        bg-gradient-to-r ${color.from} ${color.to} ${color.border} border-l-[3px] p-2 rounded-sm`}
		>
			<FaReply
				className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${color.icon} mt-0.5 flex-shrink-0`}
			/>
			<div className="flex-1 min-w-0">
				<div
					className={`font-medium text-neutral-700 truncate ${compact ? 'text-xs' : 'text-sm'}`}
				>
					{sender?.displayName ?? sender?.usernamey ?? 'Unknown'}
				</div>
				<div
					className={`text-neutral-600 ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'}`}
				>
					{displayText}
				</div>
			</div>
			{onCancel && (
				<button
					onClick={onCancel}
					className="text-neutral-400 hover:text-neutral-600 flex-shrink-0"
				>
					<FaTimes className="w-3 h-3" />
				</button>
			)}
		</div>
	);
};

export default ReplyPreview;
