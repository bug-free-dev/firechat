import Image from 'next/image';
import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

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
			container: 'mb-6 mt-3',
			logo: 'w-10 h-10 sm:w-12 sm:h-12',
			title: 'text-2xl sm:text-3xl',
			subtitle: 'text-xs',
		},
		md: {
			container: 'mb-8 mt-4 sm:mb-10 sm:mt-5',
			logo: 'w-12 h-12 sm:w-16 sm:h-16',
			title: 'text-3xl sm:text-4xl',
			subtitle: 'text-xs sm:text-sm',
		},
		lg: {
			container: 'mb-10 mt-6 sm:mb-12 sm:mt-8',
			logo: 'w-16 h-16 sm:w-20 sm:h-20',
			title: 'text-4xl sm:text-5xl',
			subtitle: 'text-sm sm:text-base',
		},
	};

	// Variant styles
	const variantClasses = {
		default: 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500',
		minimal: 'text-[#ff3e00]',
		bold: 'bg-gradient-to-r from-red-600 via-orange-500 via-yellow-400 to-red-600',
	};

	const currentSize = sizeClasses[size];

	return (
		<div className={`flex flex-col items-center ${currentSize.container} ${className}`}>
			<div className="flex items-center gap-3 sm:gap-4 group">
				<div className={`${currentSize.logo} relative flex-shrink-0`}>
					<Image
						src="/Firechat.svg"
						alt="Firechat"
						fill
						className="object-contain group-hover:scale-110 transition-transform duration-300"
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				</div>

				<div className="leading-tight min-w-0">
					<div
						className={`
            font-moonrocks font-bold flex items-center transition-all duration-300
            ${currentSize.title}
            ${
					variant === 'default' || variant === 'bold'
						? `${variantClasses[variant]} bg-clip-text text-transparent animate-gradient bg-300% bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-600`
						: variantClasses[variant]
				}
          `}
					>
						Firechat
					</div>

					{showSubtitle && (
						<div
							className={`
              font-righteous text-neutral-500 dark:text-neutral-400 mt-1 
              flex items-center gap-1 sm:gap-2 ${currentSize.subtitle}
            `}
						>
							<FaShieldAlt className="text-[#ff3e00] flex-shrink-0" />
							<span className="truncate">Exclusive.</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
