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
          rounded-xl py-1.5 px-2 break-words transition-all duration-150 z-0
          max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px] xl:max-w-[560px]
          ${isMine ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-800'}
          ${className}
        `}
			>
				<div>{children}</div>

				{(timestamp || status) && (
					<div
						className={`
              flex items-center gap-1 justify-end text-[12px] leading-none mt-1
              ${isMine ? 'text-white/50' : 'text-neutral-400'}
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
