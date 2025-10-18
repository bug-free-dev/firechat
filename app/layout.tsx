import './globals.css';

import { Analytics } from '@vercel/analytics/next';
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
	position: 'bottom-right',
	duration: 2500,
	style: {
		background: '#ffffff',
		color: '#111827',
		fontSize: '0.95rem',
		fontWeight: 500,
		borderRadius: '0.75rem',
		boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
			</body>
		</html>
	);
}
