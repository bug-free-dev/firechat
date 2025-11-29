'use client';

import React from 'react';

export type FireVariant = 'default' | 'secondary' | 'outline' | 'ghost';
export type FireSize = 'xs' | 'sm' | 'md' | 'lg';

export interface FireButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	loading?: boolean;
	variant?: FireVariant;
	size?: FireSize;
	icon?: React.ReactNode;
	iconPosition?: 'left' | 'right';
	destructive?: boolean;
}

export const FireButton = React.forwardRef<HTMLButtonElement, FireButtonProps>(
	(
		{
			children,
			loading = false,
			variant = 'default',
			size = 'md',
			icon,
			iconPosition = 'left',
			className = '',
			disabled,
			destructive = false,
			...props
		},
		ref
	) => {
		const base = `
			group relative inline-flex items-center justify-center
			font-medium rounded-md
			transition-all duration-150
			focus:outline-none focus:ring-2 focus:ring-offset-2
			disabled:pointer-events-none disabled:opacity-50
			active:scale-[0.98] select-none whitespace-nowrap
		`;

		const sizeMap: Record<FireSize, string> = {
			xs: 'h-7 px-2 text-xs gap-1.5',
			sm: 'h-8 px-3 text-xs gap-1.5',
			md: 'h-9 px-4 text-sm gap-2',
			lg: 'h-10 px-6 text-sm gap-2',
		};

		const getVariantClasses = (): string => {
			if (destructive) {
				const destructiveVariants: Record<FireVariant, string> = {
					default: `
						bg-red-600 dark:bg-red-500 text-white
						hover:bg-red-700 dark:hover:bg-red-600
						focus:ring-red-600 dark:focus:ring-red-500
						focus:ring-offset-white dark:focus:ring-offset-neutral-950
						shadow-sm
					`,
					secondary: `
						bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-50
						border-2 border-red-200/40 dark:border-red-800
						hover:bg-red-100 dark:hover:bg-red-900
						focus:ring-red-600 dark:focus:ring-red-500
						focus:ring-offset-white dark:focus:ring-offset-neutral-950
					`,
					outline: `
						bg-transparent text-red-600 dark:text-red-500
						border-2 border-red-300 dark:border-red-700
						hover:bg-red-50 dark:hover:bg-red-950
						focus:ring-red-600 dark:focus:ring-red-500
						focus:ring-offset-white dark:focus:ring-offset-neutral-950
					`,
					ghost: `
						bg-transparent text-red-600 dark:text-red-500
						hover:bg-red-50 dark:hover:bg-red-950
						focus:ring-red-600 dark:focus:ring-red-500
						focus:ring-offset-white dark:focus:ring-offset-neutral-950
					`,
				};
				return destructiveVariants[variant];
			}

			const variantMap: Record<FireVariant, string> = {
				default: `
					bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-950
					hover:bg-neutral-800 dark:hover:bg-neutral-200
					focus:ring-neutral-900 dark:focus:ring-neutral-300
					focus:ring-offset-white dark:focus:ring-offset-neutral-950
					shadow-sm
				`,
				secondary: `
					bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50
					border border-neutral-200 dark:border-neutral-700
					hover:bg-neutral-200 dark:hover:bg-neutral-700
					focus:ring-neutral-400 dark:focus:ring-neutral-600
					focus:ring-offset-white dark:focus:ring-offset-neutral-950
				`,
				outline: `
					bg-transparent text-neutral-900 dark:text-neutral-50
					border border-neutral-300 dark:border-neutral-700
					hover:bg-neutral-100 dark:hover:bg-neutral-800
					focus:ring-neutral-400 dark:focus:ring-neutral-600
					focus:ring-offset-white dark:focus:ring-offset-neutral-950
				`,
				ghost: `
					bg-transparent text-neutral-900 dark:text-neutral-50
					hover:bg-neutral-100 dark:hover:bg-neutral-800
					focus:ring-neutral-400 dark:focus:ring-neutral-600
					focus:ring-offset-white dark:focus:ring-offset-neutral-950
				`,
			};

			return variantMap[variant];
		};

		const isDisabled = disabled || loading;

		const renderContent = () => {
			if (loading) {
				return (
					<svg
						className="w-4 h-4 animate-spin text-current"
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
				);
			}

			return (
				<>
					{icon && iconPosition === 'left' && (
						<span className="flex-shrink-0 transition-transform duration-150 group-hover:scale-105">
							{icon}
						</span>
					)}
					{children}
					{icon && iconPosition === 'right' && (
						<span className="flex-shrink-0 transition-transform duration-150 group-hover:scale-105">
							{icon}
						</span>
					)}
				</>
			);
		};

		return (
			<button
				ref={ref}
				type={props.type || 'button'}
				disabled={isDisabled}
				className={`${base} ${sizeMap[size]} ${getVariantClasses()} ${className}`}
				aria-busy={loading}
				aria-disabled={isDisabled}
				{...props}
			>
				{renderContent()}
			</button>
		);
	}
);
