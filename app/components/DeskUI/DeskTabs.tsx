'use client';

import React, { useEffect, useState } from 'react';
import { FaCoins, FaComments, FaUser } from 'react-icons/fa';

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

export default function DeskTabs({ activeTab, onTabChange }: DeskTabsProps) {
	const tabs: TabConfig[] = [
		{ id: 'profile', label: 'Profile', icon: FaUser, color: 'orange' },
		{ id: 'kudos', label: 'Kudos', icon: FaCoins, color: 'yellow' },
		{ id: 'sessions', label: 'Sessions', icon: FaComments, color: 'lime' },
	];

	const [visible, setVisible] = useState(true);
	const hideTimeout = React.useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const handleMouseMove = () => {
			if (hideTimeout.current) {
				clearTimeout(hideTimeout.current);
			}
			setVisible(true);
			hideTimeout.current = setTimeout(() => setVisible(false), 2500);
		};

		window.addEventListener('mousemove', handleMouseMove);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			if (hideTimeout.current) {
				clearTimeout(hideTimeout.current);
			}
		};
	}, []);

	const getTabClasses = (tab: TabConfig, isActive: boolean) => {
		const base =
			'flex items-center gap-2 px-4 py-2 transition-all duration-200 text-sm font-medium rounded-2xl';

		if (isActive) {
			const activeStyles: Record<TabConfig['color'], string> = {
				orange: 'bg-orange-50 text-orange-600 border-orange-500',
				yellow: 'bg-yellow-50 text-yellow-600 border-yellow-500',
				lime: 'bg-lime-50 text-lime-600 border-lime-500',
			};
			return `${base} ${activeStyles[tab.color]}`;
		}

		return `${base} text-neutral-600 border-transparent hover:bg-neutral-100`;
	};

	return (
		<div
			className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
				visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
			}`}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
		>
			<div className="bg-white/90 backdrop-blur-md rounded-full border border-neutral-200 px-3 py-2 flex gap-2 shadow-lg hover:shadow-xl transition-all">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={getTabClasses(tab, isActive)}
						>
							<Icon className="w-4 h-4" />
							<span className="hidden sm:inline">{tab.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
