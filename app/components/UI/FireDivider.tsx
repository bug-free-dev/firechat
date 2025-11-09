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
			line: 'bg-gradient-to-b from-transparent via-neutral-300 to-transparent',
			ring: 'ring-neutral-400/70 bg-white',
		},
		minimal: {
			line: 'bg-neutral-200',
			ring: 'ring-neutral-300/70 bg-white',
		},
		bold: {
			line: 'bg-gradient-to-b from-orange-300 via-red-400 to-orange-300',
			ring: 'ring-orange-400/70 bg-white',
		},
	};

	return (
		<div className={`relative flex items-center justify-center w-full ${height}`}>
			{/* Divider line */}
			<div
				className={`
          absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2
          ${variantStyles[variant].line}
        `}
			/>

			{/* Top dots (small → medium → large) */}
			<div
				className={`absolute left-1/2 top-[15%] w-2 h-2 sm:w-3 sm:h-3 rounded-full transform -translate-x-1/2 ring ${variantStyles[variant].ring}`}
			/>
			<div
				className={`absolute left-1/2 top-[25%] w-3 h-3 sm:w-4 sm:h-4 rounded-full transform -translate-x-1/2 ring ${variantStyles[variant].ring}`}
			/>
			<div
				className={`absolute left-1/2 top-[35%] w-4 h-4 sm:w-5 sm:h-5 rounded-full transform -translate-x-1/2 ring ${variantStyles[variant].ring}`}
			/>

			{/* Bottom dots (large → medium → small) */}
			<div
				className={`absolute left-1/2 top-[65%] w-4 h-4 sm:w-5 sm:h-5 rounded-full transform -translate-x-1/2 ring ${variantStyles[variant].ring}`}
			/>
			<div
				className={`absolute left-1/2 top-[75%] w-3 h-3 sm:w-4 sm:h-4 rounded-full transform -translate-x-1/2 ring ${variantStyles[variant].ring}`}
			/>
			<div
				className={`absolute left-1/2 top-[85%] w-2 h-2 sm:w-3 sm:h-3 rounded-full transform -translate-x-1/2 ring ${variantStyles[variant].ring}`}
			/>

			{/* Center Logo */}
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
