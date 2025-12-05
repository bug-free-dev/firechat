'use client';

import React from 'react';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

interface ThemeToggleButtonProps {
	theme: 'light' | 'dark';
	onClick: () => void;
	isOpen: boolean;
	className?: string;
}

export const ThemeToggleButton = React.forwardRef<HTMLButtonElement, ThemeToggleButtonProps>(
	({ theme, onClick, isOpen, className = '' }, ref) => {
		const Icon = theme === 'dark' ? HiOutlineMoon : HiOutlineSun;

		return (
			<button
				ref={ref}
				onClick={onClick}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-label="Toggle theme menu"
				className={`fc-btn fc-btn--ghost ${className}`}
			>
				<Icon className="w-4 h-4" aria-hidden="true" />
			</button>
		);
	}
);
