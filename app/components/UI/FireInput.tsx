'use client';

import React, { forwardRef, useId, useMemo, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

type Firesize = 'xs' | 'sm' | 'md' | 'lg';
type FireInputVariant = 'default' | 'custom';

interface FireInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	showPasswordToggle?: boolean;
	size?: Firesize;
	variant?: FireInputVariant;
	inputClassName?: string;
	containerClassName?: string;
	helpText?: string;
}

const sizeMap: Record<Firesize, string> = {
	xs: 'py-1.5 text-xs px-2',
	sm: 'py-2 text-sm px-2',
	md: 'py-2.5 text-[15px] px-3',
	lg: 'py-3.5 text-lg px-4',
};

const variantClasses: Record<FireInputVariant, string> = {
	default: `
    bg-white dark:bg-neutral-900
    border border-neutral-200 dark:border-neutral-700/50
    rounded-lg
    transition-colors duration-200

    hover:border-neutral-300/60 dark:hover:border-neutral-600/60

    focus:outline-none
    focus:ring-2 focus:ring-neutral-400/20 dark:focus:ring-neutral-700/30
    focus:ring-offset-1 focus:ring-offset-white
    dark:focus:ring-offset-neutral-900

    focus:border-neutral-300/80 dark:focus:border-neutral-600/80
  `,
	custom: `
    rounded-t-lg border-neutral-200/50 dark:border-neutral-700/60

    bg-neutral-100/40 dark:bg-neutral-800/70
    transition-colors duration-200
    focus:bg-white

    hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80

    focus:outline-none
    focus:ring-2 focus:ring-indigo-400/30
    focus:ring-offset-2 focus:ring-offset-white
    dark:focus:ring-offset-neutral-900
    dark:focus:bg-neutral-900
  `,
};

const labelBase = 'text-sm font-medium text-neutral-700 dark:text-neutral-300';
const helpTextBase = 'text-xs text-neutral-500 dark:text-neutral-400 mt-1';

export const FireInput = forwardRef<HTMLInputElement, FireInputProps>(
	(
		{
			label,
			showPasswordToggle,
			size = 'md',
			variant = 'default',
			className = '',
			inputClassName = '',
			containerClassName = '',
			helpText,
			type = 'text',
			...props
		},
		ref
	) => {
		const id = useId();
		const [showPassword, setShowPassword] = useState(false);

		const isPassword = type === 'password';
		const shouldShowToggle = isPassword && (showPasswordToggle ?? true);
		const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

		const sizeClasses = sizeMap[size];
		const variantClass = variantClasses[variant];

		/* Compose classes: basic -> size -> user supplied -> ensure right padding for toggle -> variant LAST (authoritative) */
		const baseInput = useMemo(() => {
			const parts = [
				'w-full',
				'appearance-none',
				'placeholder-neutral-400 dark:placeholder-neutral-500',
				'text-neutral-900 dark:text-neutral-100',
				'transition-colors duration-180',
				sizeClasses,
				inputClassName,
				className,
				// ensure room for toggle / icons
				shouldShowToggle ? 'pr-10' : 'pr-3',
				// variant last so it overrides where necessary
				variantClass,
			]
				.filter(Boolean)
				.join(' ');
			return parts;
		}, [sizeClasses, variantClass, inputClassName, className, shouldShowToggle]);

		return (
			<div className={`w-full flex flex-col gap-1 select-none ${containerClassName}`}>
				{label && (
					<label htmlFor={id} className={labelBase}>
						<div className="flex items-center gap-2">
							<span>{label}</span>
							{props.required && <span className="ml-1 text-red-500">*</span>}
						</div>
					</label>
				)}

				<div className="relative">
					<input
						{...props}
						ref={ref}
						id={id}
						type={inputType}
						className={baseInput}
						aria-invalid={props['aria-invalid'] ?? undefined}
						aria-describedby={helpText ? `${id}-help` : undefined}
						style={{ WebkitTapHighlightColor: 'transparent' }}
					/>

					{shouldShowToggle && (
						<button
							type="button"
							onClick={() => setShowPassword((s) => !s)}
							tabIndex={0}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors duration-150"
						>
							{showPassword ? (
								<AiOutlineEyeInvisible size={18} />
							) : (
								<AiOutlineEye size={18} />
							)}
						</button>
					)}
				</div>

				{helpText && (
					<div id={`${id}-help`} className={helpTextBase}>
						{helpText}
					</div>
				)}
			</div>
		);
	}
);

FireInput.displayName = 'FireInput';
