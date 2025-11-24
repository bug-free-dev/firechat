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
			container: 'mt-3 mb-5',
			logo: 'w-12 h-12',
			title: 'text-3xl',
			subtitle: 'text-xs',
			icon: 'w-3 h-3',
		},
		md: {
			container: 'mt-5 mb-7',
			logo: 'w-14 h-14',
			title: 'text-4xl',
			subtitle: 'text-sm',
			icon: 'w-3.5 h-3.5',
		},
		lg: {
			container: 'mt-7 mb-10',
			logo: 'w-16 h-16 md:w-20 md:h-20',
			title: 'text-5xl',
			subtitle: 'text-base',
			icon: 'w-4 h-4',
		},
	};

	const variantClasses = {
		default:
			'bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 dark:from-orange-400 dark:via-red-400 dark:to-rose-500',
		minimal: 'text-orange-500 dark:text-orange-400',
		bold: 'bg-gradient-to-r from-orange-400 via-red-500 to-rose-600 dark:from-orange-300 dark:via-red-400 dark:to-rose-500',
	};

	const currentSize = sizeClasses[size];

	return (
  <div
    className={`
      flex flex-col items-center 
      ${currentSize.container} 
      ${className}
      dark:bg-neutral-900
    `}
  >
    <div className="flex items-center gap-3 sm:gap-4 group">
      {/* Logo with glow hover */}
      <div className={`${currentSize.logo} relative flex-shrink-0`}>
        <Image
          src="/Firechat.svg"
          alt="Firechat"
          fill
          className="object-contain group-hover:scale-110 group-hover:rotate-3 transition-all duration-200 ease-out"
        />
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
            bg-gradient-to-r from-orange-300/40 via-red-300/40 to-rose-400/40
            dark:from-orange-400/30 dark:via-red-400/30 dark:to-rose-500/30
          "
        />
      </div>

      <div className="leading-tight min-w-0">
        {/* Title */}
        <div
          className={`
            font-monton flex items-center transition-all duration-200
            ${currentSize.title}
            ${
              variant === 'default' || variant === 'bold'
                ? `${variantClasses[variant]} bg-clip-text text-transparent animate-gradient`
                : variantClasses[variant]
            }
            group-hover:tracking-wide
          `}
        >
          Firechat
        </div>

        {/* Subtitle */}
        {showSubtitle && (
          <div
            className={`
              font-righteous mt-1 flex items-center gap-1.5 sm:gap-2
              ${currentSize.subtitle}
              tracking-wide transition-all duration-200
              group-hover:gap-2 sm:group-hover:gap-3
            `}
          >
            <FaShieldAlt
              className={`
                ${currentSize.icon}
                text-red-400 dark:text-red-500 flex-shrink-0
                transition-transform duration-200 
                group-hover:scale-110 group-hover:rotate-12
              `}
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
