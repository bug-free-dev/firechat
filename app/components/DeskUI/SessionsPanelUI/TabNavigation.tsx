'use client';

import React from 'react';
import { FaComments, FaInbox } from 'react-icons/fa';

interface TabNavigationProps {
	activeTab: 'chats' | 'inbox';
	onTabChange: (tab: 'chats' | 'inbox') => void;
	activeSessions: number;
	unreadInbox: number;
}

export function TabNavigation({
	activeTab,
	onTabChange,
	activeSessions,
	unreadInbox,
}: TabNavigationProps) {
	const tabs: { id: 'chats' | 'inbox'; label: string; icon: React.ReactNode; count: number }[] = [
		{
			id: 'chats',
			label: 'Chats',
			icon: <FaComments className="w-4 h-4" />,
			count: activeSessions,
		},
		{
			id: 'inbox',
			label: 'Inbox',
			icon: <FaInbox className="w-4 h-4" />,
			count: unreadInbox,
		},
	];

	return (
		<div className="relative mb-6">
			<div className="relative flex items-center bg-white rounded-lg border border-neutral-200 overflow-hidden">
				{/* Sliding background */}
				<div
					className={`absolute top-0 left-0 h-full w-1/2 bg-neutral-800 rounded-md transition-all duration-300 ease-in-out`}
					style={{ transform: activeTab === 'chats' ? 'translateX(0%)' : 'translateX(100%)' }}
				/>

				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-300 z-10"
						title={
							tab.id === 'chats'
								? 'Where sparks turn into bonfires'
								: 'Private whispers, just for you'
						}
					>
						{/* Icon */}
						{tab.icon}

						{/* Label */}
						<span
							className={`transition-colors duration-300 ${
								activeTab === tab.id ? 'text-white' : 'text-neutral-600'
							}`}
						>
							{tab.label}
						</span>

						{/* Badge */}
						{tab.count > 0 && (
							<span
								className={`ml-1 px-1.5 py-0.5 rounded-full text-xs transition-colors duration-300 ${
									activeTab === tab.id
										? 'bg-white/30 text-white'
										: 'bg-white/20 text-neutral-800'
								}`}
							>
								{tab.count}
							</span>
						)}
					</button>
				))}
			</div>
		</div>
	);
}
