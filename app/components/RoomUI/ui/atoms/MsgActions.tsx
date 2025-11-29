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
				className={`
					absolute bottom-3 ${isMine ? 'right-2' : 'left-2'} 
					flex gap-1 items-center rounded-xl border border-neutral-200 bg-white shadow-lg
					p-1 z-[100] fc-slide-in-left duration-150
					dark:bg-zinc-900 dark:border-neutral-700
					${className}
				`}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onReply}
					aria-label="Reply"
					className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors ring-1 ring-transparent hover:ring-blue-400/40"
					type="button"
					title="Reply"
				>
					<FiCornerUpLeft size={15} />
				</button>

				<button
					onClick={onOpenReactions}
					aria-label="React"
					className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40 transition-colors ring-1 ring-transparent hover:ring-indigo-400/40"
					type="button"
					title="React"
				>
					<FiSmile size={15} />
				</button>

				<button
					onClick={onCopy}
					aria-label="Copy"
					className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors ring-1 ring-transparent hover:ring-emerald-400/40"
					type="button"
					title="Copy message"
				>
					{copied ? <FiCheckCircle size={15} /> : <FiClipboard size={15} />}
				</button>

				<button
					onClick={onThemeToggle}
					aria-label="Change theme"
					className="p-1.5 rounded text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/40 transition-colors ring-1 ring-transparent hover:ring-orange-400/40"
					type="button"
					title="Syntax theme"
				>
					<IoColorPaletteOutline size={15} />
				</button>

				{isMine && onDelete && (
					<button
						onClick={onDelete}
						aria-label="Delete"
						className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors ring-1 ring-transparent hover:ring-red-400/40"
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
