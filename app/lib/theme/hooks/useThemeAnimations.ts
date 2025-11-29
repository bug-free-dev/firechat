'use client';

import { useCallback, useRef, useState } from 'react';

interface AnimationConfig {
	duration?: number;
	reducedMotion?: boolean;
}

export const useThemeAnimation = ({ duration = 500 }: AnimationConfig = {}) => {
	const [isAnimating, setIsAnimating] = useState(false);
	const timersRef = useRef<number[]>([]);
	const anchorRef = useRef<HTMLElement | null>(null);

	const cleanup = useCallback(() => {
		timersRef.current.forEach(clearTimeout);
		timersRef.current = [];
	}, []);

	const animate = useCallback(
		(targetTheme: 'light' | 'dark', onComplete?: () => void) => {
			const prefersReduced =
				typeof window !== 'undefined' &&
				window.matchMedia('(prefers-reduced-motion: reduce)').matches;

			if (prefersReduced || !anchorRef.current || isAnimating) {
				onComplete?.();
				return;
			}

			setIsAnimating(true);
			cleanup();

			const anchor = anchorRef.current;
			const rect = anchor.getBoundingClientRect();

			// Origin point (center-left of anchor)
			const cx = Math.max(0, rect.left);
			const cy = rect.top + rect.height / 2;

			// Calculate required scale
			const dX = Math.max(cx, window.innerWidth - cx);
			const dY = Math.max(cy, window.innerHeight - cy);
			const radius = Math.sqrt(dX * dX + dY * dY);
			const scale = (radius * 2.04) / 8;

			// Create overlay
			const overlay = document.createElement('div');
			const bgColor = targetTheme === 'dark' ? '#0a0a0a' : '#ffffff';

			Object.assign(overlay.style, {
				position: 'fixed',
				left: `${cx}px`,
				top: `${cy}px`,
				width: '8px',
				height: '8px',
				borderRadius: '50%',
				background: bgColor,
				pointerEvents: 'none',
				zIndex: '99999',
				transform: 'translate(-50%, -50%) scale(0)',
				transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
				willChange: 'transform',
			});

			document.body.appendChild(overlay);

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					overlay.style.transform = `translate(-50%, -50%) scale(${scale})`;
				});

				// Theme flip at 40% mark
				const flipTimer = window.setTimeout(() => {
					onComplete?.();
				}, duration * 0.4);
				timersRef.current.push(flipTimer);

				// Collapse animation
				const collapseTimer = window.setTimeout(() => {
					overlay.style.transition = `transform ${duration * 0.3}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration * 0.2}ms ease-out`;
					overlay.style.transform = 'translate(-50%, -50%) scale(0)';
					overlay.style.opacity = '0';
				}, duration);
				timersRef.current.push(collapseTimer);

				// Cleanup
				const cleanupTimer = window.setTimeout(() => {
					overlay.remove();
					setIsAnimating(false);
				}, duration * 1.5);
				timersRef.current.push(cleanupTimer);
			});
		},
		[isAnimating, duration, cleanup]
	);

	return {
		isAnimating,
		animate,
		anchorRef,
		cleanup,
	};
};
