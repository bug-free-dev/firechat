'use client';

import React, { memo } from 'react';
import { FiCheckCircle, FiClipboard, FiCornerUpLeft, FiSmile, FiTrash2 } from 'react-icons/fi';
import { IoColorPaletteOutline } from 'react-icons/io5';

export interface MsgActionsProps {
	onReply: () => void;
	onOpenReactions: () => void;
	onCopy: () => void;
	onThemeToggle: () => void;
	onDelete?: () => void;
	copied?: boolean;
	isMine?: boolean;
	className?: string;
}

const MsgActions: React.FC<MsgActionsProps> = memo(
	({
		onReply,
		onOpenReactions,
		onCopy,
		onThemeToggle,
		onDelete,
		copied = false,
		isMine = false,
		className = '',
	}) => {
		return (
			<div
				className={`absolute bottom-3 ${isMine ? 'right-2' : 'left-2'} flex gap-1 items-center bg-white rounded-xl shadow-lg border border-neutral-200 p-1 z-[100] fc-slide-in-left duration-150 ${className}`}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onReply}
					aria-label="Reply"
					className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
					type="button"
					title="Reply"
				>
					<FiCornerUpLeft size={15} />
				</button>

				<button
					onClick={onOpenReactions}
					aria-label="React"
					className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors"
					type="button"
					title="React"
				>
					<FiSmile size={15} />
				</button>

				<button
					onClick={onCopy}
					aria-label="Copy"
					className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
					type="button"
					title="Copy message"
				>
					{copied ? <FiCheckCircle size={15} /> : <FiClipboard size={15} />}
				</button>

				<button
					onClick={onThemeToggle}
					aria-label="Change theme"
					className="p-1.5 rounded hover:bg-orange-50 text-orange-600 transition-colors"
					type="button"
					title="Syntax theme"
				>
					<IoColorPaletteOutline size={15} />
				</button>

				{isMine && onDelete && (
					<button
						onClick={onDelete}
						aria-label="Delete"
						className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
						type="button"
						title="Delete message"
					>
						<FiTrash2 size={15} />
					</button>
				)}
			</div>
		);
	}
);

export default MsgActions;
