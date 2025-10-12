'use client';

import React from 'react';

interface Tab {
	id: string;
	label: string;
}

interface TabSwitcherProps {
	activeTab: string;
	onTabChange: (tabId: string) => void;
	tabs: Tab[];
	className?: string;
}

export default function TabSwitcher({
	activeTab,
	onTabChange,
	tabs,
	className = '',
}: TabSwitcherProps) {
	return (
		<div className={`relative ${className}`}>
			<div className="flex bg-neutral-100 rounded-t-lg p-1">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`
              flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 relative
              ${
						activeTab === tab.id
							? 'bg-white text-[#ff3e00] shadow-sm'
							: 'text-neutral-600 hover:text-neutral-900'
					}
            `}
					>
						{tab.label}
						{activeTab === tab.id && (
							<div className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10 transition-all duration-300" />
						)}
					</button>
				))}
			</div>
		</div>
	);
}
