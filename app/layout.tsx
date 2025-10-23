import './globals.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Toaster, type ToastOptions } from 'react-hot-toast';

import { AuthProvider } from './lib/routing/context/AuthStateContext';

export const metadata: Metadata = {
	title: 'Firechat',
	description: 'Personalized & Fast chat app 🔥.',
	icons: {
		icon: '/Firechat.svg',
	},
};
const toastConfig: ToastOptions = {
	position: 'bottom-left',
	duration: 800,
	style: {
		background: '#ffffff',
		color: '#111827',
		fontSize: '0.95rem',
		fontWeight: 500,
		borderRadius: '0.75rem',
		padding: '14px 18px',
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
				<AuthProvider>{children}</AuthProvider>
				<Toaster {...toastConfig} />
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
