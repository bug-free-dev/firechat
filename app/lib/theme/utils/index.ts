export type Theme = 'light' | 'dark' | 'system';

export const THEMES: Theme[] = ['light', 'dark', 'system'];

/**
 * Get the next theme in rotation
 */
export function getNextTheme(current: Theme): Theme {
	if (current === 'light') return 'dark';
	if (current === 'dark') return 'light';
	return 'dark';
}

/**
 * Check if the theme is dark
 */
export function isDarkTheme(theme: Theme | string | undefined): boolean {
	return theme === 'dark';
}
