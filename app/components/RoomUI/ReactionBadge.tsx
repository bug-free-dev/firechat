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
		<div className="flex flex-wrap gap-1.5 mt-2 backdrop-blur-md">
			{Object.entries(reactions).map(([emoji, users]) => {
				const hasReacted = users.includes(currentUserId);

				return (
					<button
						key={emoji}
						onClick={() => onToggle(emoji)}
						className={`flex items-center gap-1.5 px-1.5 rounded-full text-xs font-medium transition-all duration-200 
						backdrop-blur-sm border border-white/20 shadow-sm
						${
							hasReacted
								? 'bg-white/20 text-neutral-900 ]'
								: 'bg-white/10 text-neutral-700 hover:bg-white/20 hover:scale-[1.07]'
						}`}
						style={{
							WebkitBackdropFilter: 'blur(8px)',
						}}
					>
						<span className="text-base sm:text-sm transition-transform duration-200 group-hover:scale-110">
							{emoji}
						</span>
						<span className="text-[11px]">{users.length}</span>
					</button>
				);
			})}
		</div>
	);
};

export default ReactionsDisplay;
