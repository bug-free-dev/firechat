'use client';

import React from 'react';

interface WaveLoaderProps {
	size?: number;
	gap?: number;
	colors?: string[];
	text?: string;
}

const defaultColors = ['bg-cyan-400/30', 'bg-yellow-400/30', 'bg-lime-400/30'];

export const WaveLoader: React.FC<WaveLoaderProps> = ({
	size = 2,
	gap = 2,
	colors = defaultColors,
	text = '',
}) => {
	return (
		<div className="mt-2 flex flex-col items-center justify-center">
			<div className={`flex items-end gap-${gap} h-6`}>
				{colors.map((color, idx) => (
					<span
						key={idx}
						className={`${color} w-${size} h-${size} rounded-full animate-wave`}
						style={{ animationDelay: `${idx * 0.12}s` }}
					/>
				))}
			</div>
			{text && (
				<span className="mt-2 text-sm font-medium text-neutral-600 select-none">{text}</span>
			)}
		</div>
	);
};
