'use client';

import React from 'react';
import type { FireCachedUser } from '@/app/lib/types';

interface TypingIndicatorProps {
	typingUsers: FireCachedUser[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
	if (!typingUsers || typingUsers.length === 0) return null;

	const names = typingUsers.map((u) => u.displayName || 'Someone');
	const label =
		names.length === 1
			? `${names[0]} is typing`
			: names.length <= 3
				? `${names.join(', ')} are typing`
				: `${names.length} people are typing`;

	return (
		<div
			role="status"
			aria-live="polite"
			className="relative flex items-center gap-3
        px-4 py-2 rounded-3xl bg-white/80 backdrop-blur-md
        border border-neutral-200/40 text-neutral-800 text-sm select-none z-50"
		>
			{/* Colorful animated dots */}
			<div className="flex items-center gap-1.5">
				<span className="dot bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 animate-bounce delay-0" />
				<span className="dot bg-gradient-to-tr from-yellow-400 via-orange-400 to-red-400 animate-bounce delay-150" />
				<span className="dot bg-gradient-to-tr from-green-400 via-teal-400 to-cyan-400 animate-bounce delay-300" />
			</div>

			{/* Label */}
			<span className="truncate max-w-[14rem] font-medium">
				{label}
				<span className="animate-pulse">…</span>
			</span>
		</div>
	);
}
