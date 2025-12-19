'use client';

import { useState } from 'react';

import { FireButton, FireInput, MOODS } from '@/app/components/UI';

type MoodOptionProps = {
	value: string;
	onChange: (val: string) => void;
};

export const MoodOptions: React.FC<MoodOptionProps> = ({ value, onChange }) => {
	const [custom, setCustom] = useState('');

	const handleSetCustom = () => {
		if (custom.trim()) {
			onChange(custom.trim());
			setCustom('');
		}
	};

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
				{MOODS.map((mood) => {
					const Icon = mood.icon;
					const isSelected = value === mood.label;

					return (
						<button
							key={mood.label}
							onClick={() => onChange(mood.label)}
							className={`
                flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl 
                text-sm font-medium transition-all duration-200 ring-2
                ${
							isSelected
								? `${mood.activeBg} ${mood.activeRing} ${mood.color} dark:${mood.activeBg} dark:${mood.activeRing}`
								: `bg-white dark:bg-neutral-950 ${mood.ringColor} dark:ring-neutral-700/40 ${mood.color} ${mood.hoverRing} dark:hover:ring-neutral-600/60 dark:hover:bg-neutral-800/50`
						}
              `}
						>
							<Icon className="w-4 h-4" />
							<span className="text-neutral-600 dark:text-neutral-300">{mood.label}</span>
						</button>
					);
				})}
			</div>

			<div className="flex gap-2 pt-2">
				<FireInput
					value={custom}
					onChange={(e) => setCustom(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSetCustom()}
					placeholder="Custom mood..."
					className="flex-1"
					size="sm"
				/>
				<FireButton variant="secondary" onClick={handleSetCustom} disabled={!custom.trim()}>
					Set
				</FireButton>
			</div>
		</div>
	);
};
