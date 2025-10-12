'use client';

import React, { useEffect, useRef } from 'react';

import { REACTION_EMOJIS } from '@/app/lib/types';

export interface ReactionPickerProps {
	onSelect: (emoji: string) => void;
	onClose: () => void;
	className?: string;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose, className }) => {
	const pickerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	return (
		<div
			ref={pickerRef}
			className={`absolute bottom-full mb-1 bg-white border border-neutral-200 rounded-xl shadow-lg p-1.5 flex gap-1 z-10 max-w-[200px] sm:max-w-[250px] ${className}`}
		>
			{REACTION_EMOJIS.map((emoji) => (
				<button
					key={emoji}
					onClick={() => {
						onSelect(emoji);
						onClose();
					}}
					className="text-base sm:text-lg hover:bg-neutral-100 rounded-md p-1 transition-colors flex-shrink-0"
				>
					{emoji}
				</button>
			))}
		</div>
	);
};

export default ReactionPicker;
