'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';

import { FireHeader } from './';

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface FireSlideProps {
	open: boolean;
	onClose: () => void;
	header?: React.ReactNode;
	footer?: React.ReactNode;
	children?: React.ReactNode;
	size?: Size;
	backdropStatic?: boolean;
	showBranding?: boolean;
	className?: string;
	id?: string;
}

const SIZE_MAP: Record<Size, string> = {
	sm: 'max-h-[35vh]',
	md: 'max-h-[55vh]',
	lg: 'max-h-[75vh]',
	xl: 'max-h-[90vh]',
	full: 'h-full',
};

export const FireSlide: React.FC<FireSlideProps> = ({
	open,
	onClose,
	header,
	footer,
	children,
	size = 'md',
	backdropStatic = false,
	showBranding = true,
	className = '',
	id,
}) => {
	const sheetRef = useRef<HTMLDivElement | null>(null);
	const lastActiveRef = useRef<HTMLElement | null>(null);
	const scrollPosRef = useRef(0);

	useEffect(() => {
		if (open) {
			scrollPosRef.current = window.scrollY;
			lastActiveRef.current = document.activeElement as HTMLElement | null;
			document.body.style.overflow = 'hidden';
			document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';

			requestAnimationFrame(() => {
				const el = sheetRef.current;
				if (!el) return;

				const firstFocusable = el.querySelector<HTMLElement>(
					'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
				);
				firstFocusable?.focus();
			});
		} else {
			document.body.style.overflow = '';
			document.body.style.paddingRight = '';
			setTimeout(() => lastActiveRef.current?.focus(), 100);
		}

		return () => {
			document.body.style.overflow = '';
			document.body.style.paddingRight = '';
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !backdropStatic) {
				e.preventDefault();
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [open, onClose, backdropStatic]);

	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (backdropStatic) return;
			if (e.target === e.currentTarget) onClose();
		},
		[backdropStatic, onClose]
	);

	return (
		<div
			aria-hidden={!open}
			aria-modal={open}
			role="dialog"
			id={id}
			className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${
				open ? 'pointer-events-auto' : 'pointer-events-none'
			}`}
		>
			{/* Backdrop */}
			<div
				onClick={handleBackdropClick}
				className={`absolute inset-0 bg-neutral-800/20 dark:bg-neutral-950/20 backdrop-blur-md transition-all duration-300 ease-out ${
					open ? 'opacity-100' : 'opacity-0'
				}`}
			/>

			{/* Slide container */}
			<div
				ref={sheetRef}
				className={`relative w-full transform transition-all duration-300 ease-out ${
					open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
				} ${size === 'full' ? 'h-full' : 'max-h-[95vh]'} sm:max-w-2xl md:max-w-3xl lg:max-w-4xl sm:rounded-t-2xl sm:mb-0 ${className}`}
				style={{ zIndex: 90 }}
			>
				{/* Main content */}
				<div className="flex flex-col h-full bg-white dark:bg-neutral-950 shadow-xl overflow-hidden">
					{/* Header */}
					<div className="flex-shrink-0 border-b border-neutral-200/40 dark:border-neutral-700/40 bg-white dark:bg-neutral-950">
						{showBranding && (
							<div className="px-4 pt-4 pb-2 border-b border-neutral-100 dark:border-neutral-700">
								<FireHeader showSubtitle={false} size="sm" className="mb-0" />
							</div>
						)}

						<div className="flex items-center justify-between gap-3 px-5 py-3">
							<div className="flex-1 min-w-0">
								{header && (
									<div className="font-bubblegum text-xl text-neutral-700 dark:text-neutral-200 truncate">
										{header}
									</div>
								)}
							</div>

							<button
								type="button"
								aria-label="Close dialog"
								onClick={onClose}
								className="flex-shrink-0 p-[5px] rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-500/20 active:scale-95"
							>
								<HiX className="w-3 h-3" />
							</button>
						</div>
					</div>

					{/* Body */}
					<div
						className={`flex-1 overflow-y-auto overscroll-contain px-5 py-4 ${SIZE_MAP[size]} ${
							size === 'full' ? '' : 'min-h-0'
						} bg-white dark:bg-neutral-950`}
					>
						{children}
					</div>

					{/* Footer */}
					{footer && (
						<div className="flex-shrink-0 px-5 py-4 border-t border-neutral-200/40 dark:border-neutral-700/50 bg-white dark:bg-neutral-950">
							{footer}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
