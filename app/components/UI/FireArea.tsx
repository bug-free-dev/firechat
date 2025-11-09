'use client';

import React, { TextareaHTMLAttributes } from 'react';

type FireAreaVariant = 'default' | 'custom';

interface FireAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	helperText?: string;
	icon?: React.ReactNode;
	variant?: FireAreaVariant;
	className?: string;
}

export const FireArea: React.FC<FireAreaProps> = ({
	label,
	helperText,
	icon,
	variant = 'default',
	className = '',
	...props
}) => {
	const baseClasses = `
    w-full
    outline-none
    resize-none
    text-sm
    placeholder-neutral-400
    transition-all duration-200
    dark:text-neutral-100
    p-3
  `;

	const variantClasses: Record<FireAreaVariant, string> = {
		default: `
      bg-neutral-100/30 
      border border-neutral-200/40
      rounded-md
      focus:ring-2 focus:ring-neutral-200/70
      focus:border-neutral-300 outline-none
    `,
		custom: `
      bg-neutral-100/30
      rounded-t-lg
      border-b-[3px] border-neutral-200/40
      focus:bg-white dark:focus:bg-neutral-900
      focus:border-indigo-500/60
      transition-colors duration-200
    `,
	};

	return (
		<div className={`relative w-full ${className}`}>
			{label && (
				<label className="font-knewave text-sm text-neutral-600 mb-3 block select-none">
					{label}
				</label>
			)}

			<div className="relative w-full">
				<textarea
					{...props}
					className={`${baseClasses} ${variantClasses[variant]} ${icon ? 'pr-10' : ''}`}
				/>
				{icon && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400">
						{icon}
					</div>
				)}
			</div>

			{helperText && <p className="mt-1 text-xs text-neutral-500">{helperText}</p>}
		</div>
	);
};
