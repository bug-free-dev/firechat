'use client';

import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useThemeAnimation } from '../hooks/useThemeAnimations';
import { useThemeMenu } from '../hooks/useThemeMenu';
import { ThemeMenu } from './ThemeMenu';

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
	className?: string;
	animationDuration?: number;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
	className = '',
	animationDuration = 500,
}) => {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	const { isOpen, toggle, close, menuRef } = useThemeMenu();
	const { isAnimating, animate, anchorRef } = useThemeAnimation({
		duration: animationDuration,
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleThemeSelect = (selected: ThemeOption) => {
		if (isAnimating) return;

		const visualTheme =
			selected === 'system' ? (resolvedTheme === 'dark' ? 'dark' : 'light') : selected;

		animate(visualTheme, () => {
			setTheme(selected);
		});

		close();
	};

	if (!mounted) {
		return (
			<div
				className={`h-8 w-24 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse ${className}`}
			/>
		);
	}

	const currentResolvedTheme = (resolvedTheme as 'light' | 'dark') || 'light';
	const activeTheme = (theme as ThemeOption) || 'system';

	return (
		<div className={`relative inline-block ${className}`} ref={menuRef}>
			<ThemeToggleButton
				ref={anchorRef as React.Ref<HTMLButtonElement>}
				theme={currentResolvedTheme}
				onClick={toggle}
				isOpen={isOpen}
			/>
			<ThemeMenu isOpen={isOpen} activeTheme={activeTheme} onSelect={handleThemeSelect} />
		</div>
	);
};
