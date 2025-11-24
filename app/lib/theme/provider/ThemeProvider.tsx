'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import React, { useEffect, useState } from 'react';

interface Props {
	children: React.ReactNode;
}

export const ThemeProvider: React.FC<Props> = ({ children }) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) return null;
	return (
		<NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
			{children}
		</NextThemeProvider>
	);
};
