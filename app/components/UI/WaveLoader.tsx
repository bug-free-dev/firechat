'use client';

import React from 'react';

interface WaveLoaderProps {
	size?: number;
	gap?: number;
	colors?: string[];
}

const defaultColors = ['bg-amber-400/50', 'bg-orange-500/50', 'bg-rose-500/50', 'bg-pink-500/50'];

export const WaveLoader: React.FC<WaveLoaderProps> = ({
	size = 2,
	gap = 2,
	colors = defaultColors,
}) => {
	return (
		<div className={`py-2 flex items-center justify-center gap-${gap}`}>
			{colors.map((color, idx) => (
				<span
					key={idx}
					className={`${color} w-${size} h-${size} rounded-full animate-wave`}
					style={{ animationDelay: `${idx * 0.12}s` }}
				/>
			))}
		</div>
	);
};
