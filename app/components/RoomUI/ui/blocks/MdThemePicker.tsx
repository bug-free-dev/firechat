'use client';

import { useTheme } from 'next-themes';
import React, { memo, useEffect, useRef, useState } from 'react';

import { THEMES } from '@/app/components/RoomUI/constants';

export interface InlineThemePickerProps {
	activeTheme: string;
	onChange: (themeId: string) => void;
	isVisible: boolean;
}

const InlineThemePicker: React.FC<InlineThemePickerProps> = memo(
	({ activeTheme, onChange, isVisible }) => {
		const scrollRef = useRef<HTMLDivElement>(null);
		const [isDragging, setIsDragging] = useState(false);
		const [startX, setStartX] = useState(0);
		const [scrollLeft, setScrollLeft] = useState(0);
		const { theme, systemTheme } = useTheme();
		const currentTheme = theme === 'system' ? systemTheme : theme;
		const isDark = currentTheme === 'dark';

		useEffect(() => {
			if (isVisible && scrollRef.current) {
				const activeIndex = THEMES.findIndex((t) => t.id === activeTheme);
				if (activeIndex !== -1) {
					const itemWidth = 80;
					scrollRef.current.scrollLeft = activeIndex * itemWidth - 40;
				}
			}
		}, [isVisible, activeTheme]);

		const handleDragStart = (pageX: number) => {
			if (!scrollRef.current) return;
			setIsDragging(true);
			setStartX(pageX - scrollRef.current.offsetLeft);
			setScrollLeft(scrollRef.current.scrollLeft);
		};

		const handleDragMove = (pageX: number) => {
			if (!isDragging || !scrollRef.current) return;
			const walk = (pageX - startX) * 2;
			scrollRef.current.scrollLeft = scrollLeft - walk;
		};

		if (!isVisible) return null;

		return (
			<div className="mt-2 mb-1 overflow-hidden rounded-xl backdrop-blur-sm shadow-lg p-1">
				<div
					ref={scrollRef}
					className={`flex gap-2 overflow-x-auto px-2 py-2 scrollbar-hide cursor-grab active:cursor-grabbing ${
						isDragging ? 'select-none' : ''
					}`}
					onMouseDown={(e) => handleDragStart(e.pageX)}
					onMouseMove={(e) => handleDragMove(e.pageX)}
					onMouseUp={() => setIsDragging(false)}
					onMouseLeave={() => setIsDragging(false)}
					onTouchStart={(e) => handleDragStart(e.touches[0].pageX)}
					onTouchMove={(e) => handleDragMove(e.touches[0].pageX)}
					onTouchEnd={() => setIsDragging(false)}
					style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
				>
					{THEMES.map((theme) => {
						const isActive = activeTheme === theme.id;
						const activeBg = isDark
							? 'bg-zinc-700/60 ring-1 ring-zinc-400 text-white'
							: 'bg-neutral-200 ring-1 ring-neutral-400 text-black';
						const inactiveBg = isDark
							? 'bg-zinc-800/40 ring-1 ring-zinc-600 text-zinc-300'
							: 'bg-neutral-50 ring-1 ring-neutral-300 text-neutral-800';

						return (
							<button
								key={theme.id}
								onClick={(e) => {
									e.stopPropagation();
									if (!isDragging) onChange(theme.id);
								}}
								className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-all duration-150 ${
									isActive ? activeBg : inactiveBg
								} hover:scale-105`}
								type="button"
							>
								{theme.name}
							</button>
						);
					})}
				</div>
			</div>
		);
	}
);

export default InlineThemePicker;
