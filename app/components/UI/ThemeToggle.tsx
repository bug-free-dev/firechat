'use client';

import { useTheme as useNextTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import { HiMoon, HiSun } from 'react-icons/hi';

const TRANSITION_MS = 520;

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
	const { theme, setTheme, systemTheme } = useNextTheme();
	const [mounted, setMounted] = useState(false);
	const [animating, setAnimating] = useState(false);
	const btnRef = useRef<HTMLButtonElement | null>(null);
	const overlayRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => setMounted(true), []);
	useEffect(() => {
		return () => overlayRef.current?.remove();
	}, []);

	const currentTheme = theme === 'system' ? systemTheme : theme;
	const isDark = currentTheme === 'dark';

	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const toggle = (fromClick = true) => {
		if (animating) return;
		const next = isDark ? 'light' : 'dark';

		if (prefersReduced || !btnRef.current || !fromClick) {
			setTheme(next);
			return;
		}

		setAnimating(true);

		// create single overlay element (reused per toggle)
		let overlay = overlayRef.current;
		if (!overlay) {
			overlay = document.createElement('div');
			overlayRef.current = overlay;
			Object.assign(overlay.style, {
				position: 'fixed',
				left: '50%',
				top: '50%',
				width: '0px',
				height: '0px',
				transform: 'translate(-50%, -50%) scale(0)',
				borderRadius: '50%',
				pointerEvents: 'none',
				zIndex: '9999',
				transition: `transform ${TRANSITION_MS}ms cubic-bezier(.2,.9,.3,1), background-color 120ms linear`,
			});
			document.body.appendChild(overlay);
		}

		// compute center aligned with button for nicer feel
		const rect = btnRef.current.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		overlay.style.left = `${cx}px`;
		overlay.style.top = `${cy}px`;

		// color: inverse of current theme for the reveal effect
		overlay.style.background = isDark ? '#ffffff' : '#171717';

		// compute scale large enough to cover viewport
		const dX = Math.max(cx, window.innerWidth - cx);
		const dY = Math.max(cy, window.innerHeight - cy);
		const radius = Math.sqrt(dX * dX + dY * dY);
		const scale = (radius * 1.02) / 1; // base size is effectively 1

		// trigger expand
		requestAnimationFrame(() => {
			overlay!.style.width = '2px';
			overlay!.style.height = '2px';
			overlay!.style.transform = `translate(-50%, -50%) scale(${scale})`;
		});

		// switch theme near mid-animation for a smooth visual
		setTimeout(() => setTheme(next), Math.round(TRANSITION_MS * 0.36));

		// collapse and cleanup after animation
		setTimeout(() => {
			overlay!.style.transform = 'translate(-50%, -50%) scale(0)';
			// small delay to remove and reset
			setTimeout(() => {
				overlay!.remove();
				overlayRef.current = null;
				setAnimating(false);
			}, 80);
		}, TRANSITION_MS);
	};

	if (!mounted) {
		return (
			<div
				className="w-[52px] h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse"
				aria-hidden
			/>
		);
	}

	return (
		<button
			ref={btnRef}
			type="button"
			role="switch"
			aria-checked={isDark}
			onClick={() => toggle(true)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					toggle(false); // keyboard toggles without the overlay expansion
				}
			}}
			disabled={animating}
			title="Toggle theme"
			aria-label="Toggle color theme"
			className={`relative inline-flex items-center h-8 w-14 rounded-full px-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'} ${className}`}
		>
			{/* subtle track highlight */}
			<span
				className={`absolute inset-0 rounded-full ${isDark ? 'ring-1 ring-black/20' : ''}`}
				aria-hidden
			/>

			{/* thumb */}
			<span
				aria-hidden
				style={{
					boxShadow: isDark ? '0 6px 18px rgba(2,6,23,0.6)' : '0 6px 18px rgba(8,25,60,0.06)',
				}}
				className={`relative z-10 block h-6 w-6 rounded-full transform transition-transform duration-300 ease-out ${isDark ? 'translate-x-[26px] bg-neutral-900' : 'translate-x-0 bg-white'}`}
			/>

			{/* icons */}
			<span
				className={`absolute left-2 top-1 flex h-5 w-5 items-center justify-center transition-opacity duration-200 ${isDark ? 'opacity-40' : 'opacity-100 text-yellow-500'}`}
				aria-hidden
			>
				<HiSun className="h-4 w-4" />
			</span>

			<span
				className={`absolute right-2 top-1 flex h-5 w-5 items-center justify-center transition-opacity duration-200 ${isDark ? 'opacity-100 text-indigo-200' : 'opacity-40 text-neutral-500'}`}
				aria-hidden
			>
				<HiMoon className="h-4 w-4" />
			</span>

			<span className="sr-only">{isDark ? 'Dark theme active' : 'Light theme active'}</span>
		</button>
	);
};
