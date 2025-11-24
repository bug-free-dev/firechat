'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { useThemedToast } from '@/app/lib/theme/hook/useThemedToast';

export function ThemedToaster() {
	const [mounted, setMounted] = useState(false);
	const toastStyle = useThemedToast();

	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	return (
		<Toaster
			position="bottom-left"
			toastOptions={{
				style: toastStyle,
				duration: 2000,
			}}
		/>
	);
}
