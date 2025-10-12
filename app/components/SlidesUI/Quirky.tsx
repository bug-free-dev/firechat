'use client';

import React from 'react';
import { FaBicycle, FaCamera, FaCoffee, FaGamepad, FaGuitar, FaRocket } from 'react-icons/fa';
import { GiPizzaSlice, GiUnicorn } from 'react-icons/gi';
type Props = {
	value: string[];
	onChange: (v: string[]) => void;
	step?: number;
	total?: number;
};

export default function Quirky({ value, onChange, step = 3, total = 7 }: Props) {
	const quirks = [
		{ icon: FaRocket, label: 'Space Explorer', color: '#3b82f6' },
		{ icon: GiUnicorn, label: 'Magical Dreamer', color: '#ec4899' },
		{ icon: GiPizzaSlice, label: 'Food Lover', color: '#f59e0b' },
		{ icon: FaCoffee, label: 'Caffeine Addict', color: '#8b4513' },
		{ icon: FaGuitar, label: 'Music Maker', color: '#10b981' },
		{ icon: FaGamepad, label: 'Gaming Pro', color: '#8b5cf6' },
		{ icon: FaCamera, label: 'Photo Hunter', color: '#ef4444' },
		{ icon: FaBicycle, label: 'Adventure Seeker', color: '#06b6d4' },
	];

	const toggleQuirk = (quirkLabel: string) => {
		const newValue = value.includes(quirkLabel)
			? value.filter((q) => q !== quirkLabel)
			: [...value, quirkLabel];
		onChange(newValue);
	};

	return (
		<div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden">
			{/* Fun floating icons */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-12 right-12 text-[#ec4899] opacity-60">
					<GiUnicorn className="w-10 h-10 animate-pulse" />
				</div>
				<div className="absolute top-20 right-1/4 text-[#f59e0b] opacity-50">
					<GiPizzaSlice className="w-8 h-8" />
				</div>
				<div className="absolute top-1/2 left-6 transform -translate-y-1/2 text-[#10b981] opacity-60">
					<FaGuitar className="w-11 h-11 animate-pulse" style={{ animationDelay: '0.5s' }} />
				</div>
				<div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-[#8b5cf6] opacity-50">
					<FaGamepad className="w-9 h-9 animate-float" style={{ animationDelay: '1s' }} />
				</div>
				<div className="absolute bottom-10 left-12 text-[#ef4444] opacity-60">
					<FaCamera className="w-10 h-10 animate-pulse" style={{ animationDelay: '1.5s' }} />
				</div>
			</div>

			<div className="relative z-10 max-w-3xl w-full mx-auto px-6 text-center">
				<div className="mb-12">
					<h1 className="font-dyna text-5xl lg:text-6xl text-neutral-900 inline-flex items-center justify-center gap-3 mb-3">
						<FaRocket className="text-[#3b82f6] w-12 h-12 animate-float" />
						Quirky
					</h1>
					<p className="font-righteous text-base text-neutral-500">
						Show off your unique personality
					</p>
				</div>

				<div className="mb-10">
					<h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
						What makes you quirky?
					</h2>
					<p className="text-lg text-neutral-600">
						Pick up to 3 things that describe your awesome self.
					</p>
				</div>

				<div className="mb-8">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{quirks.map((quirk) => {
							const IconComponent = quirk.icon;
							const isSelected = value.includes(quirk.label);

							return (
								<button
									key={quirk.label}
									onClick={() => toggleQuirk(quirk.label)}
									disabled={!isSelected && value.length >= 3}
									className={`
                    p-4 rounded-t-lg border-2 transition-all duration-300 hover:scale-105 group
                    ${
								isSelected
									? 'border-current shadow-lg scale-105'
									: value.length >= 3
										? 'border-neutral-200 opacity-50 cursor-not-allowed'
										: 'border-neutral-200 hover:border-neutral-300'
							}
                  `}
									style={{
										color: isSelected ? quirk.color : '#6b7280',
										backgroundColor: isSelected ? `${quirk.color}10` : 'transparent',
									}}
								>
									<IconComponent className="w-8 h-8 mx-auto mb-2" />
									<div className="text-sm font-medium">{quirk.label}</div>
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex items-center justify-center gap-3 text-base text-neutral-500 mb-8">
					<span>Pro tip: be yourself — quirky is cool! ({value.length}/3 selected)</span>
				</div>

				<div className="flex items-center justify-center gap-3">
					<div className="w-3 h-3 rounded-full bg-[#3b82f6] animate-pulse" />
					<span className="text-sm text-neutral-500 font-medium mb-2">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
