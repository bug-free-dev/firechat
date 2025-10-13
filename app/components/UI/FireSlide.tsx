'use client';

import React, { useEffect, useRef } from 'react';

import FireHeader from '@/app/components/UI/FireHeader';

type Size = 'sm' | 'md' | 'lg' | 'full';

export interface FireSlideProps {
	open: boolean;
	onClose: () => void;
	header?: React.ReactNode;
	footer?: React.ReactNode;
	children?: React.ReactNode;
	size?: Size;
	backdropStatic?: boolean;
	id?: string;
}

const SIZE_MAP: Record<Size, string> = {
	sm: 'max-h-[40vh]',
	md: 'max-h-[60vh]',
	lg: 'max-h-[80vh]',
	full: 'h-full',
};

export default function FireSlide({
	open,
	onClose,
	header,
	footer,
	children,
	size = 'md',
	backdropStatic = false,
	id,
}: FireSlideProps) {
	const sheetRef = useRef<HTMLDivElement | null>(null);
	const lastActiveRef = useRef<HTMLElement | null>(null);

	// prevent background scroll while open
	useEffect(() => {
		if (open) {
			lastActiveRef.current = document.activeElement as HTMLElement | null;
			document.body.style.overflow = 'hidden';
			// focus first focusable inside sheet after open
			requestAnimationFrame(() => {
				const el = sheetRef.current;
				if (!el) return;
				const firstFocusable = el.querySelector<HTMLElement>(
					'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
				);
				firstFocusable?.focus();
			});
		} else {
			document.body.style.overflow = '';
			// restore focus
			lastActiveRef.current?.focus();
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	// close on ESC
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape' && open) {
				onClose();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	// backdrop click handler
	const onBackdropClick = (e: React.MouseEvent) => {
		if (backdropStatic) return;
		// only close if backdrop itself was clicked (not inner content)
		if (e.target === e.currentTarget) onClose();
	};

	return (
		<div
			aria-hidden={!open}
			className={`fixed inset-0 z-50 pointer-events-none`}
			aria-modal={open}
			role="dialog"
			id={id}
		>
			{/* Backdrop */}
			<div
				onClick={onBackdropClick}
				className={`absolute inset-0 transition-opacity duration-300 ${
					open ? 'opacity-70 pointer-events-auto bg-neutral-500/10' : 'opacity-0'
				}`}
			/>

			{/* Slide sheet container */}
			<div
				className={`fixed left-0 right-0 bottom-0 flex justify-center pointer-events-none`}
				style={{ zIndex: 60 }}
			>
				<div
					ref={sheetRef}
					// container transforms for slide effect, pointer-events enabled when open
					className={`pointer-events-auto w-full sm:max-w-3xl transform transition-transform duration-300 ease-out
            ${open ? 'translate-y-0' : 'translate-y-full'}
            ${size === 'full' ? 'h-full' : ''}
          `}
				>
					{/* Small Firechat header */}
					<div className="px-4 pt-3 pb-2 bg-white border-b border-neutral-100">
						{/* Firechat small brand header (minimal) */}
						<FireHeader showSubtitle={false} size="sm" variant="minimal" className="mb-1" />

						{/* compact title / header slot + close */}
						<div className="flex items-center justify-between gap-2 mt-1">
							<div className="min-w-0">
								{/* if caller passed a header node, render it; else render nothing */}
								<div className="text-sm text-neutral-600 truncate ml-4">
									{header ?? null}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<button
									aria-label="Close"
									onClick={onClose}
									className="p-[5px] rounded-md hover:bg-neutral-100 border-neutral-200 border-2"
								>
									esc
								</button>
							</div>
						</div>

						{/* Body - scrollable */}
						<div
							className={`relative overflow-y-auto bg-white px-4 py-4 ${SIZE_MAP[size]} ${
								size === 'full' ? 'flex-1' : ''
							}`}
						>
							{children}
						</div>

						{/* Footer (optional) */}
						{footer ? <div className="px-4 py-3  bg-neutral-50">{footer}</div> : null}
					</div>
				</div>
			</div>
		</div>
	);
}
