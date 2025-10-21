'use client';

import React from 'react';

import { WaveLoader } from '@/app/components/UI';
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
			className="relative inline-flex items-center gap-2 px-4 py-2 rounded-3xl
				bg-white/80 backdrop-blur-md border border-neutral-200/40
				text-neutral-800 text-sm select-none z-50"
		>
			<WaveLoader
				size={2}
				gap={1}
				colors={['bg-pink-400/70', 'bg-yellow-400/70', 'bg-green-400/70']}
			/>
			<span className="truncate max-w-[14rem] font-medium">{label}</span>
		</div>
	);
}
