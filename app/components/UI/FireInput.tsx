'use client';

import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface FireInputProps {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	showPasswordToggle?: boolean;
	className?: string;
	onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export default function FireInput({
	label,
	value,
	onChange,
	type = 'text',
	placeholder,
	required = false,
	disabled = false,
	showPasswordToggle = false,
	className = '',
	onKeyDown,
	id,
}: FireInputProps & { id?: string }) {
	const [showPassword, setShowPassword] = useState(false);

	const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
	const inputId = id || label?.toLowerCase().replace(/\s+/g, '_') || 'input-field';

	return (
		<div className={`space-y-2 ${className}`}>
			{label && (
				<label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}

			<div className="relative">
				<input
					id={inputId}
					type={inputType}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					required={required}
					disabled={disabled}
					onKeyDown={onKeyDown}
					className="w-full px-4 py-3 bg-white border-0 border-b-3 border-neutral-200 
                     focus:outline-none focus:border-yellow-400 focus:bg-neutral-50/50
                     disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
                     transition-all duration-300 hover:border-neutral-300
                     text-base placeholder-neutral-400 rounded-t-lg"
					aria-label={label}
				/>

				{showPasswordToggle && type === 'password' && (
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
						tabIndex={-1}
					>
						{showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
					</button>
				)}
			</div>
		</div>
	);
}
