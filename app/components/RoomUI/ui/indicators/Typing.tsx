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
			className="
        ml-2 inline-flex items-center gap-2 px-3 py-1 rounded-2xl
        text-sm font-medium truncate max-w-[14rem] select-none z-50
        backdrop-blur-md border bg-white/80 border-neutral-200 text-neutral-800
        dark:bg-neutral-800/70 dark:border-neutral-700 dark:text-neutral-100
      "
		>
			<div className="flex items-center justify-center">
				<WaveLoader size={2} gap={1} />
			</div>
			<span className="truncate">{label}</span>
		</div>
	);
});

export default TypingIndicator;
