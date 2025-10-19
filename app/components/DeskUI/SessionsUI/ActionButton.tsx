'use client';

import React from 'react';
import { MdOutlineWhatshot } from 'react-icons/md';

interface FloatingActionButtonProps {
	onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
	return (
		<button
			onClick={onClick}
			className="fixed bottom-8 right-8 w-16 h-16 bg-neutral-800 text-white rounded-full shadow-2xl hover:shadow-neutral-400/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group z-20"
			aria-label="Fire Up a Session"
		>
			<MdOutlineWhatshot className="w-7 h-7 group-hover:animate-pulse text-orange-400" />
		</button>
	);
};
