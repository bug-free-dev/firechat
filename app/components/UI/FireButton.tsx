'use client';

import React from 'react';

interface FireButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	type?: 'button' | 'submit' | 'reset';
	loading?: boolean;
	disabled?: boolean;
	variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
	size?: 'small' | 'medium' | 'large';
	className?: string;
}

export default function FireButton({
	children,
	onClick,
	type = 'button',
	loading = false,
	disabled = false,
	variant = 'default',
	size = 'medium',
	className = '',
}: FireButtonProps) {
	const base = `inline-flex items-center justify-center font-medium rounded-md
		transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
		focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`;

	const sizeMap = {
		small: 'h-9 px-3 text-sm',
		medium: 'h-10 px-4 py-2 text-sm',
		large: 'h-11 px-8 text-base',
	};

	const variantMap: Record<string, string> = {
		default: 'bg-neutral-900 text-neutral-50 hover:bg-neutral-800 focus-visible:ring-neutral-950',
		secondary:
			'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-400',
		outline:
			'border border-neutral-300 bg-white hover:bg-neutral-50 hover:text-neutral-900 focus-visible:ring-neutral-400',
		ghost: 'hover:bg-neutral-100 hover:text-neutral-900',
		destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-sm',
	};

	const isDisabled = disabled || loading;

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={isDisabled}
			className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`}
			aria-busy={loading}
		>
			{loading ? (
				<span className="flex items-center gap-2">
					<svg
						className="w-4 h-4 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				</span>
			) : (
				children
			)}
		</button>
	);
}
