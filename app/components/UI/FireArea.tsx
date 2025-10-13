'use client';

import React, { TextareaHTMLAttributes } from 'react';

interface FireAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	helperText?: string;
	icon?: React.ReactNode;
	error?: string;
	className?: string;
}

export default function FireArea({
	label,
	helperText,
	icon,
	error,
	className = '',
	...props
}: FireAreaProps) {
	return (
		<div className={`relative w-full ${className}`}>
			{label && (
				<label className="font-dyna text-sm text-neutral-600 mb-1 block select-none">
					{label}
				</label>
			)}

			<div className="relative w-full">
				<textarea
					{...props}
					autoFocus
					className={`
            w-full px-4 py-3 pr-10 text-base text-neutral-800
            bg-white border-b-3 border-neutral-200 rounded-t-lg resize-none
            placeholder-neutral-400 focus:outline-none focus:bg-neutral-50/50
            focus:border-b-yellow-400 transition-all duration-300
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
            ${error ? 'border-b-red-500' : ''}
          `}
				/>

				{icon && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400">
						{icon}
					</div>
				)}
			</div>

			{(helperText || error) && (
				<p className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-neutral-500'}`}>
					{error || helperText}
				</p>
			)}
		</div>
	);
}
