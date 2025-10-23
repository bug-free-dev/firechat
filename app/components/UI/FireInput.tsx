'use client';

import React, { forwardRef, useId, useMemo, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

type FireInputSize = 'sm' | 'md' | 'lg';
type FireInputVariant = 'default' | 'custom';

interface FireInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	showPasswordToggle?: boolean;
	inputSize?: FireInputSize;
	variant?: FireInputVariant;
	inputClassName?: string;
	containerClassName?: string;
}

const sizeMap: Record<FireInputSize, string> = {
	sm: 'py-1.5 text-sm px-2',
	md: 'py-2.5 text-[15px] px-3',
	lg: 'py-3.5 text-lg px-4',
};

/**
 * Variants:
 * - default: rounded box
 * - custom: border b-3
 */
const variantClasses: Record<FireInputVariant, string> = {
	default:
		'bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-300/70 hover:border-neutral-300/60',
	custom:
		'rounded-t-lg border-b-3 border-neutral-200/50 dark:border-neutral-700 bg-neutral-100/30 dark:bg-neutral-800/70 focus:bg-white dark:focus:bg-transparent focus:border-violet-500/80 transition-colors duration-200',
};

const labelBase = 'text-sm font-medium text-neutral-700 dark:text-neutral-200';

export const FireInput = forwardRef<HTMLInputElement, FireInputProps>(
	(
		{
			label,
			showPasswordToggle,
			inputSize = 'md',
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

		const sizeClasses = sizeMap[inputSize];
		const variantClass = variantClasses[variant];

		const baseInput = useMemo(
			() =>
				[
					'w-full',
					'outline-none',
					'appearance-none',
					'placeholder-neutral-400',
					'text-neutral-900 dark:text-neutral-100',
					'transition-colors duration-180',
					sizeClasses,
					variantClass,
					inputClassName,
					className,
					'pr-10',
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
							className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 text-neutral-500 hover:text-neutral-700 transition-colors duration-150"
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
