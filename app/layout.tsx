import './globals.css';

import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';

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
				<AuthProvider>{children}</AuthProvider>
				<Toaster />
				<Analytics />
			</body>
		</html>
	);
}
