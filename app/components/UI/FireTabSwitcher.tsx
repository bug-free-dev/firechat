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
	// Memoize active index for performance
	const activeIndex = useMemo(() => tabs.findIndex((t) => t.id === activeTab), [tabs, activeTab]);

	// Size variants
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

	// Variant styles
	const variantClasses = {
		pills: 'rounded-xl',
		rounded: 'rounded-lg',
	};

	// Calculate indicator position and width
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
				className={`relative flex items-center bg-neutral-100 ${variantClasses[variant]} p-1 overflow-hidden`}
			>
				{/* Sliding background indicator */}
				<div
					className={`absolute top-1 bottom-1 left-1 bg-white ${variantClasses[variant]} ${animated ? 'transition-all duration-300 ease-out' : ''}`}
					style={indicatorStyle}
				/>

				{/* Tab buttons */}
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
								relative flex-1 
								flex items-center justify-center
								${gapClasses[size]}
								${sizeClasses[size]}
								font-medium
								transition-all duration-200 
								z-10
								${isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}
								${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
							`}
						>
							{/* Icon - Left */}
							{tab.icon && iconPosition === 'left' && (
								<span
									className={`flex-shrink-0 ${animated ? 'transition-colors duration-200' : ''}`}
								>
									{tab.icon}
								</span>
							)}

							{/* Label */}
							<span className={animated ? 'transition-colors duration-200' : ''}>
								{tab.label}
							</span>

							{/* Icon - Right */}
							{tab.icon && iconPosition === 'right' && (
								<span
									className={`flex-shrink-0 ${animated ? 'transition-colors duration-200' : ''}`}
								>
									{tab.icon}
								</span>
							)}

							{/* Count Badge */}
							{hasCount && (
								<span
									className={`
										px-1.5 py-0.5 
										rounded-full 
										text-xs 
										font-medium 
										${animated ? 'transition-all duration-200' : ''}
										${isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}
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
