'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiGift } from 'react-icons/fi';
import { IoChatbubblesOutline } from 'react-icons/io5';
import { RiUserLine } from 'react-icons/ri';

export type Tabs = 'profile' | 'kudos' | 'sessions';

interface DeskTabsProps {
	activeTab: Tabs;
	onTabChange: (tab: Tabs) => void;
}

interface TabConfig {
	id: Tabs;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	color: 'orange' | 'yellow' | 'lime';
}

export const NavTabs: React.FC<DeskTabsProps> = ({ activeTab, onTabChange }) => {
	const tabs: TabConfig[] = [
		{ id: 'profile', label: 'Profile', icon: RiUserLine, color: 'orange' },
		{ id: 'kudos', label: 'Kudos', icon: FiGift, color: 'yellow' },
		{ id: 'sessions', label: 'Sessions', icon: IoChatbubblesOutline, color: 'lime' },
	];

	const [visible, setVisible] = useState(true);
	const hideTimeout = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const handleMouseMove = () => {
			if (hideTimeout.current) clearTimeout(hideTimeout.current);
			setVisible(true);
			hideTimeout.current = setTimeout(() => setVisible(false), 2500);
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			if (hideTimeout.current) clearTimeout(hideTimeout.current);
		};
	}, []);

	const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

	const highlightColor =
		activeTab === 'profile'
			? 'bg-orange-100 dark:bg-orange-600/40'
			: activeTab === 'kudos'
				? 'bg-yellow-100 dark:bg-yellow-500/30'
				: 'bg-lime-100 dark:bg-lime-600/30';

	const indicatorStyle = useMemo(() => {
		if (activeIndex === -1) return { opacity: 0 };
		const width = `calc(${100 / tabs.length}% - 0.2rem)`;
		const translateX = `calc(${activeIndex * 100}% + 0.3rem)`;
		return {
			width,
			transform: `translateX(${translateX})`,
		};
	}, [activeIndex, tabs.length]);

	const colorMap: Record<TabConfig['color'], string> = {
		orange: 'text-orange-600 dark:text-orange-400',
		yellow: 'text-yellow-500 dark:text-yellow-300',
		lime: 'text-lime-600 dark:text-lime-400',
	};

	// Base classes
	const containerBase =
		'relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/40 rounded-full px-2 flex gap-2 overflow-hidden';
	const buttonBase =
		'relative z-10 flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold rounded-full transition-colors duration-300';

	return (
		<div
			className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
				visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
			}`}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
		>
			<div className={containerBase}>
				{/* Sliding background highlight */}
				<div
					className={`absolute inset-y-1 left-0 ${highlightColor} rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]`}
					style={indicatorStyle}
				/>

				{tabs.map((tab) => {
					const Icon = tab.icon;
					return (
						<button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={`${buttonBase} ${colorMap[tab.color]}`}
						>
							<Icon className="w-4 h-4" />
							<span className="hidden sm:inline">{tab.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
};
