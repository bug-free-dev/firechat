'use client';

import React, { forwardRef } from 'react';

import { StatusIndicator } from '@/app/components/RoomUI/ui/indicators';
import type { MessageStatus } from '@/app/lib/types';

interface MsgBubbleProps {
	children: React.ReactNode;
	isMine?: boolean;
	className?: string;
	status?: MessageStatus;
	timestamp?: string;
}

const MsgBubble = forwardRef<HTMLDivElement, MsgBubbleProps>(
	({ children, isMine = false, className = '', status, timestamp }, ref) => {
		return (
			<div
				ref={ref}
				className={`
          rounded-xl py-1.5 px-2 break-words transition-all duration-150 z-0 max-w-70
          ${
					isMine
						? 'bg-neutral-900 text-white dark:bg-zinc-800/80 dark:text-white'
						: 'bg-white border-2 border-neutral-200 text-neutral-800 dark:bg-zinc-900 dark:border-neutral-700 dark:text-neutral-200'
				}
          ${className}
        `}
			>
				<div>{children}</div>

				{(timestamp || status) && (
					<div
						className={`
              flex items-center gap-1 justify-end text-[12px] leading-none mt-1
              ${
						isMine
							? 'text-white/50 dark:text-white/40'
							: 'text-neutral-400 dark:text-neutral-500'
					}
            `}
					>
						{timestamp && <span>{timestamp}</span>}
						{isMine && status && <StatusIndicator status={status} />}
					</div>
				)}
			</div>
		);
	}
);

export default MsgBubble;
