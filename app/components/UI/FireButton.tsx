'use client';

import React from 'react';

interface FireButtonProps {
	children: React.ReactNode;
	onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	type?: 'button' | 'submit' | 'reset';
	loading?: boolean;
	disabled?: boolean;
	variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export const FireButton: React.FC<FireButtonProps> = ({
	children,
	onClick,
	type = 'button',
	loading = false,
	disabled = false,
	variant = 'default',
	size = 'md',
	className = '',
}) => {
	const base = `
	inline-flex items-center justify-center font-medium rounded-lg
	transition-all duration-200
	focus:outline-none focus:ring-2 focus:ring-offset-2
	disabled:pointer-events-none disabled:opacity-50
	focus:ring-offset-neutral-100 dark:focus:ring-offset-neutral-900
`;

	const sizeMap: Record<string, string> = {
		sm: 'h-9 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-11 px-8 text-base',
	};

	const variantMap: Record<string, string> = {
		default: `
			bg-neutral-100 text-neutral-900 dark:bg-neutral-800/80 dark:text-neutral-100
			hover:bg-neutral-200 dark:hover:bg-neutral-600/90
			focus:ring-neutral-700/40
		`,
		secondary: `
			bg-neutral-200 text-neutral-900 dark:bg-neutral-700/80 dark:text-neutral-200
			hover:bg-neutral-300 dark:hover:bg-neutral-500/90
			focus:ring-neutral-600/40
		`,
		outline: `
			bg-transparent text-neutral-900 dark:text-neutral-100
			border border-neutral-300 dark:border-neutral-600/50
			backdrop-blur-sm
			hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50
			focus:ring-neutral-600/40
		`,
		ghost: `
			bg-transparent text-neutral-900 dark:text-neutral-100
			hover:bg-neutral-100/40 dark:hover:bg-neutral-700/40
			focus:ring-neutral-600/30
		`,
		destructive: `
			bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/30
		`,
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
};
