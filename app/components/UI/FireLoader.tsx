'use client';

import React from 'react';
import { HiFire } from 'react-icons/hi';

type LoaderProps = {
	size?: number;
	message?: string;
	compact?: boolean;
	className?: string;
};

export const FireLoader: React.FC<LoaderProps> = ({ size = 100, message, compact, className }) => {
	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center bg-white/80 ${className || ''}`}
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
						<circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="2" />
						<path
							d="M22 12a10 10 0 0 1-10 10"
							stroke="#ff7a4a"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>

					<div className="absolute inset-0 flex items-center justify-center">
						<HiFire style={{ color: '#ff7a4a' }} size={size * 0.4} aria-hidden />
					</div>
				</div>

				{/* Message */}
				{message && (
					<div className={`${compact ? 'text-sm' : 'text-base'} text-gray-700`}>
						<span>{message}</span>
					</div>
				)}
			</div>
		</div>
	);
};
