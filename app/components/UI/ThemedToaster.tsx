'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { useThemedToast } from '@/app/lib/theme/hooks/useThemedToast';

export function ThemedToaster() {
	const [mounted, setMounted] = useState(false);
	const toastStyle = useThemedToast();

	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	return (
		<Toaster
			position="top-center"
			toastOptions={{
				style: toastStyle,
				duration: 2000,
			}}
		/>
	);
}
