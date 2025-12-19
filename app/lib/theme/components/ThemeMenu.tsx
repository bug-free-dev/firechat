'use client';

import React from 'react';
import { HiCheck, HiDesktopComputer, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeMenuProps {
	isOpen: boolean;
	activeTheme: ThemeOption;
	onSelect: (theme: ThemeOption) => void;
}

const themeOptions: Array<{
	value: ThemeOption;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}> = [
	{ value: 'light', label: 'Light', icon: HiOutlineSun },
	{ value: 'dark', label: 'Dark', icon: HiOutlineMoon },
	{ value: 'system', label: 'System', icon: HiDesktopComputer },
];

export const ThemeMenu: React.FC<ThemeMenuProps> = ({ isOpen, activeTheme, onSelect }) => {
	return (
		<div
			role="menu"
			aria-orientation="vertical"
			aria-hidden={!isOpen}
			className={`
        absolute left-0 mt-2 w-40
        origin-top-left
        rounded-xl
        bg-white dark:bg-neutral-950
        border border-neutral-200 dark:border-neutral-700/40
        shadow-lg dark:shadow-2xl
        transition-all duration-150 ease-out
        ${
				isOpen
					? 'opacity-100 scale-100 pointer-events-auto'
					: 'opacity-0 scale-95 pointer-events-none'
			}
      `}
			style={{ zIndex: 50 }}
		>
			<div className="p-1">
				{themeOptions.map(({ value, label, icon: Icon }) => {
					const isActive = activeTheme === value;
					return (
						<button
							key={value}
							role="menuitem"
							onClick={() => onSelect(value)}
							className={`
                w-full flex items-center gap-3 px-3 py-2
                text-sm rounded-xl 
                ${
							isActive
								? 'text-neutral-900 dark:text-neutral-100 font-medium'
								: 'text-neutral-600 dark:text-neutral-400 font-normal'
						}
                hover:bg-neutral-50 dark:hover:bg-neutral-950/50
                focus:bg-neutral-50 dark:focus:bg-neutral-950/50
                focus:outline-none
                transition-colors duration-150
              `}
						>
							<span className="flex items-center justify-center w-5 h-5">
								<Icon className="h-4 w-4" />
							</span>
							<span className="flex-1 text-left">{label}</span>
							{isActive && (
								<span className="flex items-center justify-center w-5 h-5">
									<HiCheck className="h-4 w-4 text-blue-600 dark:text-blue-500" />
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};
