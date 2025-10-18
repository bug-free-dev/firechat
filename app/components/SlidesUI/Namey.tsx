'use client';

import React from 'react';
import {
	RiHeart3Line,
	RiLightbulbLine,
	RiMagicLine,
	RiPaletteLine,
	RiSparklingLine,
	RiStarLine,
	RiUserSmileLine,
} from 'react-icons/ri';

import FireInput from '@/app/components/UI/FireInput';

type NameyProps = {
	value: string;
	onChange: (v: string) => void;
	step?: number;
	total?: number;
};

export function Namey({ value, onChange, step = 1, total = 7 }: NameyProps) {
	return (
		<div className="relative w-full h-full min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
			{/* Floating Decorative Icons */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[50%] left-[4%] text-blue-400/40">
					<RiPaletteLine className="w-14 h-14 animate-float-elegant" />
				</div>
				<div className="absolute top-[10%] right-[7%] text-violet-400/35">
					<RiMagicLine className="w-11 h-11 animate-drift" />
				</div>
				<div className="absolute top-[20%] right-[22%] text-indigo-300/30"></div>

				<div className="absolute top-[50%] right-[5%] -translate-y-1/2 text-blue-300/30">
					<RiSparklingLine
						className="w-10 h-10 animate-float-elegant"
						style={{ animationDelay: '1s' }}
					/>
				</div>
				<div className="absolute bottom-[14%] left-[9%] text-violet-400/40">
					<RiHeart3Line
						className="w-11 h-11 animate-pulse-soft"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
				<div className="absolute bottom-[10%] right-[12%] text-indigo-300/35">
					<RiStarLine className="w-10 h-10 animate-drift" style={{ animationDelay: '2s' }} />
				</div>
				<div className="absolute top-[33%] left-[20%] text-blue-200/25">
					<div
						className="w-7 h-7 bg-gradient-to-br from-blue-400/20 to-violet-400/20 rounded-full animate-pulse-soft"
						style={{ animationDelay: '0.8s' }}
					/>
				</div>
				<div className="absolute bottom-[35%] right-[28%] text-violet-200/25">
					<div
						className="w-5 h-5 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full animate-float-elegant"
						style={{ animationDelay: '1.2s' }}
					/>
				</div>
			</div>

			{/* Main Content */}
			<div className="relative z-10 max-w-2xl w-full mx-auto px-6 text-center animate-fade-in-up">
				{/* Brand Heading */}
				<div className="mb-12">
					<h1 className="font-dyna text-5xl lg:text-6xl text-slate-900 inline-flex items-center justify-center gap-3 mb-4">
						<RiUserSmileLine className="text-blue-500 w-12 h-12 animate-pulse-soft" />
						Namey
					</h1>
					<p className="font-righteous text-base text-slate-500">
						A tiny step to make Firechat feel like yours
					</p>
				</div>

				{/* Main Question */}
				<div className="mb-12">
					<h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-5">
						What should we call you?
					</h2>
					<p className="text-slate-600 text-base font-righteous">
						Give us a goofy username that you will love to type.
					</p>
				</div>

				{/* Input Field */}
				<div className="mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
					<FireInput
						variant="custom"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Please choose a goofy username"
					/>
				</div>

				{/* Pro Tip */}
				<div
					className="flex items-center justify-center gap-2 text-base text-slate-500 mb-10 animate-fade-in"
					style={{ animationDelay: '0.2s' }}
				>
					<RiLightbulbLine className="text-amber-500 w-6 h-6 animate-pulse-soft" />
					<span>Pro tip: keep it short and sticky — 1 or 2 words work best.</span>
				</div>

				{/* Step Counter */}
				<div
					className="flex items-center justify-center gap-3 animate-fade-in"
					style={{ animationDelay: '0.3s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse-soft" />
					<span className="text-sm text-slate-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
