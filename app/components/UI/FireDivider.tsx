'use client';

import Image from 'next/image';

interface FireDividerProps {
	height?: string;
	showLogo?: boolean;
	animated?: boolean;
	variant?: 'default' | 'minimal' | 'bold';
}

export const FireDivider: React.FC<FireDividerProps> = ({
	height = 'min-h-[400px] sm:min-h-[700px]',
	showLogo = true,
	animated = true,
	variant = 'default',
}) => {
	const variantStyles = {
		default: {
			line: 'bg-gradient-to-b from-transparent via-neutral-300 to-transparent dark:via-neutral-600',
			ring: 'ring-neutral-400/70 bg-white dark:ring-neutral-500/70 dark:bg-neutral-800',
		},
		minimal: {
			line: 'bg-neutral-200 dark:bg-neutral-700',
			ring: 'ring-neutral-300/70 bg-white dark:ring-neutral-400/70 dark:bg-neutral-800',
		},
		bold: {
			line: 'bg-gradient-to-b from-orange-300 via-red-400 to-orange-300 dark:from-orange-500 dark:via-red-600 dark:to-orange-500',
			ring: 'ring-orange-400/70 bg-white dark:ring-orange-500/70 dark:bg-neutral-800',
		},
	};

	const renderDot = (top: string, size: number, smSize: number) => (
		<div
			key={top}
			className={`absolute left-1/2 top-[${top}] w-${size} h-${size} sm:w-${smSize} sm:h-${smSize} 
        rounded-full transform -translate-x-1/2 ring ${variantStyles[variant].ring}`}
		/>
	);

	return (
		<div className={`relative flex items-center justify-center w-full ${height}`}>
			{/* Divider line */}
			<div
				className={`absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2 ${variantStyles[variant].line}`}
			/>

			{/* Top dots */}
			{renderDot('15%', 2, 3)}
			{renderDot('25%', 3, 4)}
			{renderDot('35%', 4, 5)}

			{/* Bottom dots */}
			{renderDot('65%', 4, 5)}
			{renderDot('75%', 3, 4)}
			{renderDot('85%', 2, 3)}

			{/* Center Logo */}
			{showLogo && (
				<div
					className={`absolute left-1/2 top-1/2 w-10 h-10 sm:w-12 sm:h-12 
            bg-white dark:bg-neutral-800 border-2 border-orange-300 rounded-full 
            flex items-center justify-center shadow-xl 
            transform -translate-x-1/2 -translate-y-1/2 
            transition-transform duration-300
            ${animated ? 'hover:scale-110' : ''}`}
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
