'use client';

import React, { forwardRef, useId, useMemo, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

type Firesize = 'sm' | 'md' | 'lg';
type FireInputVariant = 'default' | 'custom';

interface FireInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	showPasswordToggle?: boolean;
	size?: Firesize;
	variant?: FireInputVariant;
	inputClassName?: string;
	containerClassName?: string;
}

const sizeMap: Record<Firesize, string> = {
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
    rounded-t-lg border-neutral-200/50 dark:border-neutral-700

    bg-neutral-100/30 dark:bg-neutral-800/70
    transition-colors duration-200

    focus:bg-white dark:focus:bg-neutral-900

    focus:ring-2 focus:ring-indigo-400
    focus:ring-offset-2 focus:ring-offset-white
    dark:focus:ring-offset-neutral-900
  `,
};

const labelBase = 'text-sm font-medium text-neutral-700 dark:text-neutral-300';

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

		const baseInput = useMemo(
			() =>
				[
					'w-full',
					'outline-none',
					'appearance-none',
					'placeholder-neutral-400 dark:placeholder-neutral-500',
					'text-neutral-900 dark:text-neutral-100',
					'bg-white dark:bg-neutral-900',
					'border-neutral-200 dark:border-neutral-700',
					'transition-colors duration-180',
					sizeClasses,
					variantClass,
					inputClassName,
					className,
					'pr-5',
				]
					.filter(Boolean)
					.join(' '),
			[sizeClasses, variantClass, inputClassName, className]
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
					<input
						{...props}
						ref={ref}
						id={id}
						type={inputType}
						className={baseInput}
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
			</div>
		);
	}
);
