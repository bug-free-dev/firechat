'use client';

import { useTheme } from 'next-themes';

export function useThemedToast() {
	const { theme, systemTheme } = useTheme();
	const current = theme === 'system' ? systemTheme : theme;
	const isDark = current === 'dark';

	const base = {
		fontSize: '0.95rem',
		fontWeight: 500,
		borderRadius: '0.75rem',
		border: isDark ? '1px solid #27272A' : '1px solid #E5E5E5',
		boxShadow: isDark ? '0 4px 12px #00000033' : '0 4px 12px #0000001A',
		background: isDark ? '#171717' : '#FFFFFF',
		color: isDark ? '#FFFFFF' : '#000000',
	};

	return base;
}
