'use client';

import React, { memo, useEffect, useRef, useState } from 'react';

import { THEMES } from '@/app/components/RoomUI/constants';

export interface InlineThemePickerProps {
	activeTheme: string;
	onChange: (themeId: string) => void;
	isVisible: boolean;
}

const InlineThemePicker: React.FC<InlineThemePickerProps> = memo(({ 
	activeTheme,
	onChange,
	isVisible,
}) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);

	useEffect(() => {
		if (isVisible && scrollRef.current) {
			const activeIndex = THEMES.findIndex((t) => t.id === activeTheme);
			if (activeIndex !== -1) {
				const itemWidth = 80;
				scrollRef.current.scrollLeft = activeIndex * itemWidth - 40;
			}
		}
	}, [isVisible, activeTheme]);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (!scrollRef.current) return;
		setIsDragging(true);
		setStartX(e.pageX - scrollRef.current.offsetLeft);
		setScrollLeft(scrollRef.current.scrollLeft);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging || !scrollRef.current) return;
		e.preventDefault();
		const x = e.pageX - scrollRef.current.offsetLeft;
		const walk = (x - startX) * 2;
		scrollRef.current.scrollLeft = scrollLeft - walk;
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleMouseLeave = () => {
		setIsDragging(false);
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		if (!scrollRef.current) return;
		setIsDragging(true);
		setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
		setScrollLeft(scrollRef.current.scrollLeft);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging || !scrollRef.current) return;
		const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
		const walk = (x - startX) * 2;
		scrollRef.current.scrollLeft = scrollLeft - walk;
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
	};

	if (!isVisible) return null;

	return (
		<div
			className={`
      mt-2 mb-1 overflow-hidden rounded-lg`}
		>
			<div
				ref={scrollRef}
				className={`
          flex gap-2 overflow-x-auto px-2 py-2
          scrollbar-hide cursor-grab active:cursor-grabbing
          ${isDragging ? 'select-none' : ''}
        `}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				style={{
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
				}}
			>
				{THEMES.map((theme) => {
					const isActive = activeTheme === theme.id;

					return (
						<button
							key={theme.id}
							onClick={(e) => {
								e.stopPropagation();
								if (!isDragging) {
									onChange(theme.id);
								}
							}}
							className={`
                flex-shrink-0 px-3 py-1.5 rounded-md
                text-[10px] font-medium whitespace-nowrap
                transition-all duration-150
                ${
							isActive
								? 'bg-neutral-500/20 ring-2 ring-neutral-400 text-neutral-300'
								: 'bg-neutral-50 ring-2 ring-neutral-400 text-neutral-900'
						}
              `}
							type="button"
						>
							{theme.name}
						</button>
					);
				})}
			</div>
		</div>
	);
});

export default InlineThemePicker;
