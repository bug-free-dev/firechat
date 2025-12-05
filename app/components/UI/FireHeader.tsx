'use client';

import Image from 'next/image';
import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

import { ThemeToggle } from '@/app/lib/theme';

interface FireHeaderProps {
	showSubtitle?: boolean;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'minimal' | 'bold';
	className?: string;
}

export const FireHeader: React.FC<FireHeaderProps> = ({
	showSubtitle = true,
	size = 'md',
	variant = 'default',
	className = '',
}) => {
	const sizeClasses = {
		sm: {
			container: 'mb-4',
			logo: 'w-12 h-12',
			title: 'text-3xl',
			subtitle: 'text-xs',
			icon: 'w-3 h-3',
		},
		md: {
			container: 'mb-6',
			logo: 'w-14 h-14',
			title: 'text-4xl',
			subtitle: 'text-sm',
			icon: 'w-3.5 h-3.5',
		},
		lg: {
			container: 'mb-8',
			logo: 'w-16 h-16 md:w-20 md:h-20',
			title: 'text-5xl',
			subtitle: 'text-base',
			icon: 'w-4 h-4',
		},
	};

	const variantClasses = {
		default: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500',
		minimal: 'text-orange-500 dark:text-orange-400',
		bold: 'bg-gradient-to-r from-orange-400 via-red-500 to-rose-600 dark:from-orange-300 dark:via-red-400 dark:to-rose-500',
	};

	const currentSize = sizeClasses[size];

	return (
		<div
			className={`relative flex flex-col items-center py-2 ${currentSize.container} ${className}`}
		>
			{/* Theme Toggle on extreme left */}
			<div className="absolute top-2 left-1">
				<ThemeToggle />
			</div>

			{/* Centered Logo + Title */}
			<div className="flex items-center gap-2">
				{/* Logo */}
				<div className={`${currentSize.logo} relative flex-shrink-0`}>
					<Image
						src="/Firechat.svg"
						alt="Firechat"
						fill
						className="object-contain transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3"
					/>
					<div
						className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
        bg-gradient-to-r from-orange-300/40 via-red-300/40 to-rose-400/40
        dark:from-orange-400/30 dark:via-red-400/30 dark:to-rose-500/30"
					/>
				</div>

				{/* Title & Subtitle */}
				<div className="leading-tight min-w-0 text-center">
					<div
						className={`font-monton ${currentSize.title} ${
							variant === 'default' || variant === 'bold'
								? `${variantClasses[variant]} bg-clip-text text-transparent animate-gradient`
								: variantClasses[variant]
						}`}
					>
						Firechat
					</div>

					{showSubtitle && (
						<div
							className={`font-righteous mt-1 flex items-center justify-center gap-1.5 sm:gap-2 ${currentSize.subtitle}`}
						>
							<FaShieldAlt
								className={`${currentSize.icon} text-red-400 dark:text-red-500 flex-shrink-0`}
							/>
							<span className="truncate text-neutral-500 dark:text-neutral-300">
								Fire your chat!
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
