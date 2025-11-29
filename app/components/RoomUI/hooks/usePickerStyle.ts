'use client';

import { useTheme } from 'next-themes';
import type { CSSProperties } from 'react';

export function useReactionPickerStyle(anchorRect: DOMRect | null, maxWidth = 280): CSSProperties {
	const { theme, systemTheme } = useTheme();
	const current = theme === 'system' ? systemTheme : theme;
	const isDark = current === 'dark';

	const baseStyle: CSSProperties = {
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		padding: 2,
		borderRadius: 12,
		border: isDark ? '1px solid #27272A' : '1px solid #E5E5E5',
		boxShadow: isDark ? '0 6px 18px rgba(0,0,0,0.3)' : '0 6px 18px rgba(0,0,0,0.12)',
		background: isDark ? '#171717' : '#FFFFFF',
		color: isDark ? '#FFFFFF' : '#000000',
		visibility: 'hidden',
		zIndex: 100000,
		gap: 2,
		maxWidth,
	};

	if (anchorRect) {
		const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		const width = Math.min(maxWidth, vw - 16);
		const centerX = anchorRect.left + anchorRect.width / 2;
		let left = Math.round(centerX - width / 2);
		left = Math.max(8, Math.min(left, vw - width - 8)) - 5;

		return {
			...baseStyle,
			width,
			left,
			visibility: 'visible',
		};
	}

	return baseStyle;
}
