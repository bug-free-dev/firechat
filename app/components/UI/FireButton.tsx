'use client';

import React from 'react';

interface FireButtonProps {
	children: React.ReactNode;
	onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	type?: 'button' | 'submit' | 'reset';
	loading?: boolean;
	disabled?: boolean;
	variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
	size?: 'xs' | 'sm' | 'md' | 'lg';
	className?: string;
	icon?: React.ReactNode;
	iconPosition?: 'left' | 'right';
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
	icon,
	iconPosition = 'left',
}) => {
	const base = `
		group relative inline-flex items-center justify-center 
		font-medium rounded-lg
		transition-all duration-200 ease-out
		focus:outline-none focus:ring-2

		disabled:pointer-events-none disabled:opacity-50
		active:scale-[0.98]
		select-none
	`;

	const sizeMap: Record<string, string> = {
		xs: 'h-7 px-2.5 text-xs gap-1.5',
		sm: 'h-8 px-3 text-sm gap-2',
		md: 'h-9 px-4 text-sm gap-2',
		lg: 'h-10 px-5 text-base gap-2.5',
	};

	const variantMap: Record<string, string> = {
		default: `
			bg-neutral-100 dark:bg-neutral-800
			text-neutral-900 dark:text-neutral-100
			hover:bg-neutral-200 dark:hover:bg-neutral-700
			focus:ring-neutral-300 dark:focus:ring-neutral-700
			focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900
		`,
		secondary: `
			bg-neutral-50 dark:bg-neutral-900/50
			text-neutral-700 dark:text-neutral-300
			border border-neutral-200 dark:border-neutral-800
			hover:bg-neutral-100 dark:hover:bg-neutral-800/80
			hover:border-neutral-300 dark:hover:border-neutral-700/40
			focus:ring-neutral-300 dark:focus:ring-neutral-700
			focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-900
		`,
		outline: `
			bg-transparent
			text-neutral-700 dark:text-neutral-300
			border border-neutral-300 dark:border-neutral-700/50
			hover:bg-neutral-50 dark:hover:bg-neutral-900/50
			hover:border-neutral-400 dark:hover:border-neutral-700
			focus:ring-neutral-300 dark:focus:ring-neutral-700
			focus:ring-offset-2 focus:ring-offset-neutral-100 dark:focus:ring-offset-neutral-900
		`,
		ghost: `
			bg-transparent
			text-neutral-700 dark:text-neutral-300
			hover:bg-neutral-100 dark:hover:bg-neutral-800/50
			focus:ring-neutral-300 dark:focus:ring-neutral-700
			focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-900
		`,
		destructive: `
			bg-red-600 dark:bg-red-600
			text-white dark:text-white
			hover:bg-red-700 dark:hover:bg-red-700
			focus:ring-red-400 dark:focus:ring-red-500
			focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900
		`,
	};

	const isDisabled = disabled || loading;

	const renderContent = () => {
		if (loading) {
			return (
				<>
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
							strokeWidth="3"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				</>
			);
		}

		return (
			<>
				{icon && iconPosition === 'left' && (
					<span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
						{icon}
					</span>
				)}
				{children}
				{icon && iconPosition === 'right' && (
					<span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
						{icon}
					</span>
				)}
			</>
		);
	};

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={isDisabled}
			className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`.trim()}
			aria-busy={loading}
			aria-disabled={isDisabled}
		>
			{renderContent()}
		</button>
	);
};
