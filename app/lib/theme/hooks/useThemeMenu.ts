'use client';

import { useEffect, useRef, useState } from 'react';

export const useThemeMenu = () => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
				setIsOpen(false);
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleEscape);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isOpen]);

	const toggle = () => setIsOpen((prev) => !prev);
	const close = () => setIsOpen(false);

	return {
		isOpen,
		toggle,
		close,
		menuRef,
	};
};
