'use client';

import React from 'react';

export interface ReactionsDisplayProps {
	reactions: Record<string, string[]>;
	currentUserId: string;
	onToggle: (emoji: string) => void;
}

const ReactionsDisplay: React.FC<ReactionsDisplayProps> = ({
	reactions,
	currentUserId,
	onToggle,
}) => {
	if (!reactions || Object.keys(reactions).length === 0) return null;

	return (
		<div className="absolute -bottom-3 left-3 flex flex-wrap gap-1.5 z-10">
			{Object.entries(reactions).map(([emoji, users]) => {
				const hasReacted = users.includes(currentUserId);

				return (
					<button
						key={emoji}
						onClick={(e) => {
							e.stopPropagation();
							onToggle(emoji);
						}}
						className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm border-2
						${
							hasReacted
								? 'bg-slate-50 border-slate-500/30 text-slate-700 scale-105'
								: 'bg-white border-gray-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:scale-105'
						}`}
					>
						<span className="text-sm">{emoji}</span>
						<span className="text-xs font-semibold">{users.length}</span>
					</button>
				);
			})}
		</div>
	);
};

export default ReactionsDisplay;
