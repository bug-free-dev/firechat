'use client';

import React, { memo } from 'react';

import { WaveLoader } from '@/app/components/UI';
import type { CachedUser } from '@/app/lib/types';

interface TypingIndicatorProps {
	typingUsers: CachedUser[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = memo(({ typingUsers }) => {
	if (!typingUsers || typingUsers.length === 0) return null;

	const names = typingUsers.map((u) => u.displayName || 'Someone');
	const label =
		names.length === 1
			? `${names[0]} is typing...`
			: names.length <= 3
				? `${names.join(', ')} are typing...`
				: `${names.length} people are typing...`;

	return (
		<div
			role="status"
			aria-live="polite"
			className="ml-2 relative inline-flex items-center gap-2 px-4 rounded-3xl 
        bg-white/80 backdrop-blur-md border border-neutral-200/40
        text-neutral-800 text-sm select-none z-50"
		>
			<div className="flex items-center justify-center">
				<WaveLoader size={2} gap={1} />
			</div>
			<span className="truncate max-w-[14rem] font-medium">{label}</span>
		</div>
	);
});

export default TypingIndicator;
