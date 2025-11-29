'use client';

import React from 'react';
import { PiPizza } from 'react-icons/pi';
import {
	RiBikeLine,
	RiCameraLine,
	RiCupLine,
	RiGamepadLine,
	RiMagicLine,
	RiMusic2Line,
	RiRocketLine,
	RiSparklingLine,
} from 'react-icons/ri';

type QuirkyProps = {
	value: string[];
	onChange: (v: string[]) => void;
	step?: number;
	total?: number;
};

export function Quirky({ value, onChange, step = 3, total = 7 }: QuirkyProps) {
	const quirks = [
		{ icon: RiRocketLine, label: 'Space Explorer', color: '#3b82f6' },
		{ icon: RiMagicLine, label: 'Magical Dreamer', color: '#ec4899' },
		{ icon: PiPizza, label: 'Food Lover', color: '#f59e0b' },
		{ icon: RiCupLine, label: 'Caffeine Addict', color: '#92400e' },
		{ icon: RiMusic2Line, label: 'Music Maker', color: '#10b981' },
		{ icon: RiGamepadLine, label: 'Gaming Pro', color: '#8b5cf6' },
		{ icon: RiCameraLine, label: 'Photo Hunter', color: '#ef4444' },
		{ icon: RiBikeLine, label: 'Adventure Seeker', color: '#06b6d4' },
	];

	const toggleQuirk = (quirkLabel: string) => {
		const newValue = value.includes(quirkLabel)
			? value.filter((q) => q !== quirkLabel)
			: [...value, quirkLabel];
		onChange(newValue);
	};

	return (
		<div className="relative w-full h-full min-h-[700px] flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-900">
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[10%] right-[10%] text-pink-400/40 dark:text-pink-400/20">
					<RiMagicLine className="w-11 h-11 animate-drift" />
				</div>
				<div className="absolute top-[27%] left-[9%] text-amber-400/35 dark:text-amber-400/15">
					<PiPizza className="w-9 h-9 animate-float-elegant" />
				</div>
				<div className="absolute top-[50%] left-[5%] -translate-y-1/2 text-emerald-400/40 dark:text-emerald-400/20">
					<RiMusic2Line
						className="w-12 h-12 animate-pulse-soft"
						style={{ animationDelay: '0.5s' }}
					/>
				</div>
				<div className="absolute top-[50%] right-[6%] -translate-y-1/2 text-violet-400/35 dark:text-violet-400/15">
					<RiGamepadLine
						className="w-10 h-10 animate-drift"
						style={{ animationDelay: '1s' }}
					/>
				</div>
				<div className="absolute bottom-[12%] left-[10%] text-red-400/40 dark:text-red-400/20">
					<RiCameraLine
						className="w-11 h-11 animate-pulse-soft"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
			</div>

			<div className="mt-3 relative z-10 max-w-3xl w-full mx-auto px-6 text-center animate-fade-in-up">
				<div className="mb-14">
					<h1 className="font-bubblegum text-5xl lg:text-6xl text-zinc-900 dark:text-neutral-100 inline-flex items-center justify-center gap-3 mb-4">
						<RiSparklingLine className="text-indigo-500 dark:text-indigo-400 w-12 h-12 animate-pulse-soft" />
						Quirky
					</h1>
					<p className="font-righteous text-base text-zinc-500 dark:text-neutral-400">
						Show off your unique personality
					</p>
				</div>

				<div className="mb-12">
					<h2 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-neutral-100 mb-5">
						What makes you quirky?
					</h2>
					<p className="text-base text-zinc-600 dark:text-neutral-400">
						Pick up to 3 things that describe your awesome self.
					</p>
				</div>

				<div className="mb-10 " style={{ animationDelay: '0.1s' }}>
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
                    p-5 rounded-xl border-2 transition-all duration-300 hover:-translate-y-0.5 group
                    ${
								isSelected
									? 'border-current scale-105'
									: value.length >= 3
										? 'border-zinc-200 dark:border-neutral-700/40 opacity-50 cursor-not-allowed'
										: 'border-zinc-200 dark:border-neutral-700/40 hover:border-zinc-300 dark:hover:border-neutral-600/60'
							}
                  `}
									style={{
										color: isSelected ? quirk.color : '#64748b',
										backgroundColor: isSelected ? `${quirk.color}08` : 'transparent',
									}}
								>
									<IconComponent className="w-9 h-9 mx-auto mb-2.5" />
									<div className="text-sm font-medium dark:text-neutral-200">
										{quirk.label}
									</div>
								</button>
							);
						})}
					</div>
				</div>

				<div
					className="flex items-center justify-center gap-3 text-base text-zinc-500 dark:text-neutral-400 mb-10 "
					style={{ animationDelay: '0.2s' }}
				>
					<span>Pro tip: be yourself — quirky is cool! ({value.length}/3 selected)</span>
				</div>

				<div
					className="flex items-center justify-center mb-5 gap-3 "
					style={{ animationDelay: '0.3s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse-soft" />
					<span className="text-sm text-zinc-500 dark:text-neutral-400 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
