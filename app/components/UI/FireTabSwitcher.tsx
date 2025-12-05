'use client';

import React, { useMemo } from 'react';

interface FireTab<T extends string = string> {
	id: T;
	label: string;
	icon?: React.ReactNode;
	count?: number;
	disabled?: boolean;
	tooltip?: string;
}

interface FireTabSwitcherProps<T extends string = string> {
	activeTab: T;
	onTabChange: (tabId: T) => void;
	tabs: FireTab<T>[];
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'pills' | 'rounded';
	showCounts?: boolean;
	iconPosition?: 'left' | 'right';
	animated?: boolean;
}

export const FireTabSwitcher = <T extends string = string>({
	activeTab,
	onTabChange,
	tabs,
	className = '',
	size = 'md',
	variant = 'rounded',
	showCounts = true,
	iconPosition = 'left',
	animated = true,
}: FireTabSwitcherProps<T>) => {
	const activeIndex = useMemo(() => tabs.findIndex((t) => t.id === activeTab), [tabs, activeTab]);

	const sizeClasses = {
		sm: 'py-2 px-3 text-xs',
		md: 'py-2.5 px-4 text-sm',
		lg: 'py-3 px-5 text-base',
	};

	const gapClasses = {
		sm: 'gap-1.5',
		md: 'gap-2',
		lg: 'gap-2.5',
	};

	const variantClasses = {
		pills: 'rounded-xl',
		rounded: 'rounded-lg',
	};

	const indicatorStyle = useMemo(() => {
		if (activeIndex === -1) return { opacity: 0 };

		const width = `calc(${100 / tabs.length}% - ${tabs.length === 2 ? '4px' : '2px'})`;
		const translateX = `calc(${activeIndex * 100}%)`;

		return {
			width,
			transform: `translateX(${translateX})`,
		};
	}, [activeIndex, tabs.length]);

	return (
		<div className={`relative ${className}`}>
			<div
				className={`
					relative flex items-center
					bg-neutral-100 dark:bg-neutral-800/40
					${variantClasses[variant]}
					p-1 overflow-hidden
				`}
			>
				<div
					className={`
						absolute top-1 bottom-1 left-1
						bg-white dark:bg-neutral-700/40
						${variantClasses[variant]}
						${animated ? 'transition-all duration-300 ease-out' : ''}
					`}
					style={indicatorStyle}
				/>

				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;
					const isDisabled = tab.disabled;
					const hasCount = showCounts && tab.count !== undefined && tab.count > 0;

					return (
						<button
							key={tab.id}
							onClick={() => !isDisabled && onTabChange(tab.id)}
							disabled={isDisabled}
							title={tab.tooltip}
							className={`
								relative flex-1 flex items-center justify-center
								${gapClasses[size]}
								${sizeClasses[size]}
								font-medium
								transition-all duration-200 z-10

								${
									isActive
										? 'text-neutral-900 dark:text-neutral-100'
										: 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
								}

								${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
							`}
						>
							{tab.icon && iconPosition === 'left' && (
								<span className={animated ? 'transition-colors duration-200' : ''}>
									{tab.icon}
								</span>
							)}

							<span className={animated ? 'transition-colors duration-200' : ''}>
								{tab.label}
							</span>

							{tab.icon && iconPosition === 'right' && (
								<span className={animated ? 'transition-colors duration-200' : ''}>
									{tab.icon}
								</span>
							)}

							{hasCount && (
								<span
									className={`
										px-1.5 py-0.5 rounded-full text-xs font-medium
										${animated ? 'transition-all duration-200' : ''}

										${
											isActive
												? 'bg-neutral-950 dark:bg-neutral-100 text-white dark:text-neutral-900'
												: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
										}
									`}
								>
									{tab.count}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};
