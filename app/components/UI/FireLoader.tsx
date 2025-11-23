'use client';

import React from 'react';

type LoaderProps = {
	size?: number;
	message?: string;
	compact?: boolean;
	className?: string;
};

export const FireLoader: React.FC<LoaderProps> = ({ size = 150, message, compact, className }) => {
	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-neutral-900 ${className || ''}`}
			role="status"
			aria-live="polite"
		>
			<div className={`flex items-center gap-3 ${compact ? '' : 'flex-col'}`}>
				{/* Spinner */}
				<div className="relative flex items-center justify-center">
					<svg
						className="animate-spin"
						width={size}
						height={size}
						viewBox="0 0 24 24"
						fill="none"
					>
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="#e5e7eb"
							className="dark:stroke-neutral-700"
							strokeWidth="2"
						/>
						<path
							d="M22 12a10 10 0 0 1-10 10"
							stroke="#2b2b2b"
							className="dark:stroke-neutral-50"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</div>

				{/* Message */}
				{message && (
					<div className={`${compact ? 'text-sm' : 'text-base'} text-gray-700 dark:text-neutral-100`}>
						<span>{message}</span>
					</div>
				)}
			</div>
		</div>
	);
};
