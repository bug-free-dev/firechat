import './globals.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';

import {ThemedToaster} from "@/app/components/UI"
import { ThemeProvider } from '@/app/lib/theme/provider/ThemeProvider';

import { AuthProvider } from './lib/routing/context/AuthStateContext';

export const metadata: Metadata = {
	title: 'Firechat',
	description: 'Personalized & Fast chat app 🔥.',
	icons: {
		icon: '/Firechat.svg',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
         <body className={`antialiased`}>
            <ThemeProvider
    >
				<AuthProvider>{children}</AuthProvider>
				<ThemedToaster />
    </ThemeProvider>
				<Analytics />
				<SpeedInsights />

			</body>
		</html>
	);
}
