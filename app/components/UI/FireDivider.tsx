// app/components/Divider.tsx
'use client';

import Image from 'next/image';

interface FireDividerProps {
	height?: string;
	showLogo?: boolean;
	animated?: boolean;
	variant?: 'default' | 'minimal' | 'bold';
}

const FireDivider = ({
	height = 'min-h-[400px] sm:min-h-[700px]',
	showLogo = true,
	animated = true,
	variant = 'default',
}: FireDividerProps) => {
	const variantStyles = {
		default: {
			line: 'bg-gradient-to-b from-transparent via-neutral-300 to-transparent',
			dots: 'bg-gradient-to-br from-orange-400 to-red-500',
		},
		minimal: {
			line: 'bg-neutral-200',
			dots: 'bg-neutral-400',
		},
		bold: {
			line: 'bg-gradient-to-b from-orange-300 via-red-400 to-orange-300',
			dots: 'bg-gradient-to-br from-red-500 to-orange-600',
		},
	};

	return (
		<div className={`relative flex items-center justify-center w-full ${height}`}>
			{/* Vertical line */}
			<div
				className={`
        absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2
        ${variantStyles[variant].line}
      `}
			></div>

			{/* Animated dots */}
			<div
				className={`
        absolute left-1/2 top-1/4 w-2 h-2 sm:w-3 sm:h-3 rounded-full 
        transform -translate-x-1/2 ${variantStyles[variant].dots}
        ${animated ? '' : ''}
      `}
			></div>

			<div
				className={`
        absolute left-1/2 top-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full 
        transform -translate-x-1/2 shadow-lg ${variantStyles[variant].dots}
        ${animated ? ' animation-delay-300' : ''}
      `}
			></div>

			<div
				className={`
        absolute left-1/2 top-3/4 w-2 h-2 sm:w-3 sm:h-3 rounded-full 
        transform -translate-x-1/2 ${variantStyles[variant].dots}
        ${animated ? ' animation-delay-600' : ''}
      `}
			></div>

			{/* Center logo */}
			{showLogo && (
				<div
					className={`
          absolute left-1/2 top-1/2 w-10 h-10 sm:w-12 sm:h-12 
          bg-white border-2 border-orange-300 rounded-full 
          flex items-center justify-center shadow-xl 
          transform -translate-x-1/2 -translate-y-1/2 
          transition-transform duration-300
          ${animated ? 'hover:scale-110' : ''}
        `}
				>
					<Image
						src="/Firechat.svg"
						alt="Firechat Logo"
						width={32}
						height={32}
						className="object-contain w-6 h-6 sm:w-8 sm:h-8"
					/>
				</div>
			)}
		</div>
	);
};

export default FireDivider;
