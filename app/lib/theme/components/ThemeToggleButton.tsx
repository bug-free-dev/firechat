'use client';

import React from 'react';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

import { FireButton } from '@/app/components/UI';

interface ThemeToggleButtonProps {
	theme: 'light' | 'dark';
	onClick: () => void;
	isOpen: boolean;
	className?: string;
	variant?: 'default' | 'secondary' | 'outline' | 'ghost';
	size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const ThemeToggleButton = React.forwardRef<HTMLButtonElement, ThemeToggleButtonProps>(
	({ theme, onClick, isOpen, className = '', variant = 'ghost', size = 'xs' }, ref) => {
		const Icon = theme === 'dark' ? HiOutlineMoon : HiOutlineSun;

		return (
			<FireButton
				ref={ref}
				onClick={onClick}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-label="Toggle theme menu"
				variant={variant}
				size={size}
				className={`gap-2 ${className}`}
			>
				<Icon className="h-4.5 w-4.5" aria-hidden="true" />
			</FireButton>
		);
	}
);
