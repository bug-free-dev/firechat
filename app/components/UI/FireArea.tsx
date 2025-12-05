'use client';

import React, { forwardRef, TextareaHTMLAttributes, useId, useMemo } from 'react';

type Firesize = 'sm' | 'md' | 'lg';
type FireAreaVariant = 'default' | 'custom';

interface FireAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
	label?: string;
	helperText?: string;
	icon?: React.ReactNode;
	size?: Firesize;
	variant?: FireAreaVariant;
	containerClassName?: string;
	textareaClassName?: string;
}

const sizeMap: Record<Firesize, string> = {
	sm: 'py-2 px-2 text-sm leading-5',
	md: 'py-2.5 px-3 text-[15px] leading-6',
	lg: 'py-3.5 px-4 text-lg leading-7',
};

const variantClasses: Record<FireAreaVariant, string> = {
	default: `
		bg-white dark:bg-neutral-950
		border border-neutral-200 dark:border-neutral-700/40
		rounded-lg
		transition-colors duration-200

		hover:border-neutral-300/60 dark:hover:border-neutral-600/60

		focus:outline-none
		focus:ring-2 focus:ring-neutral-400/20 dark:focus:ring-neutral-700/30
	   focus:ring-offset-white
		dark:focus:ring-offset-neutral-900

		focus:border-neutral-300/80 dark:focus:border-neutral-600/80
	`,
	custom: `
		rounded-t-lg
		border-neutral-200/50 dark:border-neutral-700/40

      hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80

		bg-neutral-100/40 dark:bg-neutral-800/70
		backdrop-blur-sm
		transition-colors duration-200

		focus:bg-white dark:focus:bg-neutral-950
		focus:ring-2 focus:ring-indigo-400/30

		focus:ring-offset-2 focus:ring-offset-white
		dark:focus:ring-offset-neutral-900
	`,
};

const labelBase = 'text-sm font-medium text-neutral-700 dark:text-neutral-300';

export const FireArea = forwardRef<HTMLTextAreaElement, FireAreaProps>(
	(
		{
			label,
			helperText,
			icon,
			containerClassName = '',
			textareaClassName = '',
			className = '',
			size = 'md',
			variant = 'default',
			...props
		},
		ref
	) => {
		const id = useId();
		const sizeClasses = sizeMap[size];
		const variantClass = variantClasses[variant];

		const baseTextarea = useMemo(
			() =>
				[
					'w-full',
					'resize-none',
					'outline-none',
					'appearance-none',
					'placeholder-neutral-400 dark:placeholder-neutral-500',
					'text-neutral-900 dark:text-neutral-100',
					'transition-colors duration-180',
					sizeClasses,
					variantClass,
					textareaClassName,
					className,
					icon ? 'pr-10' : '',
				]
					.filter(Boolean)
					.join(' '),
			[sizeClasses, variantClass, textareaClassName, className, icon]
		);

		return (
			<div className={`w-full flex flex-col gap-1 select-none ${containerClassName}`}>
				{label && (
					<label htmlFor={id} className={labelBase}>
						{label}
						{props.required && <span className="ml-1 text-red-500">*</span>}
					</label>
				)}

				<div className="relative">
					<textarea
						{...props}
						ref={ref}
						id={id}
						className={baseTextarea}
						style={{ WebkitTapHighlightColor: 'transparent' }}
					/>

					{icon && (
						<div className="absolute right-2 top-3 text-neutral-500 dark:text-neutral-400">
							{icon}
						</div>
					)}
				</div>

				{helperText && (
					<p className="text-xs text-neutral-500 dark:text-neutral-400">{helperText}</p>
				)}
			</div>
		);
	}
);
