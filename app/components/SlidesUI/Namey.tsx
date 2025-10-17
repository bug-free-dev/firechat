'use client';

import React from 'react';
import {
	FaFire,
	FaGem,
	FaHeart,
	FaLightbulb,
	FaMagic,
	FaPalette,
	FaSmile,
	FaStar,
	FaTag,
} from 'react-icons/fa';

import FireInput from '@/app/components/UI/FireInput';

type Props = {
	value: string;
	onChange: (v: string) => void;
	step?: number;
	total?: number;
};

export default function Namey({ value, onChange, step = 1, total = 7 }: Props) {
	return (
		<div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden">
			{/* Floating Decorative Icons */}
			<div className="absolute inset-0 pointer-events-none">
				{/* Top Left Area */}
				<div className="absolute top-8 left-8 text-[#ffb88b] opacity-70">
					<FaPalette className="w-12 h-12 animate-float-slow" />
				</div>

				{/* Top Right Area */}
				<div className="absolute top-12 right-12 text-[#ff9b58] opacity-60">
					<FaMagic className="w-10 h-10 " />
				</div>

				{/* Top Center Right */}
				<div className="absolute top-20 right-1/4 text-[#ffd9b8] opacity-50">
					<FaStar className="w-8 h-8 " />
				</div>

				{/* Middle Left */}
				<div className="absolute top-1/2 left-6 transform -translate-y-1/2 text-[#ffe6d0] opacity-60">
					<FaSmile className="w-11 h-11 " style={{ animationDelay: '0.5s' }} />
				</div>

				{/* Middle Right */}
				<div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-[#ff6b3d] opacity-50">
					<FaGem className="w-9 h-9 " style={{ animationDelay: '1s' }} />
				</div>

				{/* Bottom Left Area */}
				<div className="absolute bottom-16 left-12 text-[#ffb88b] opacity-60">
					<FaHeart className="w-10 h-10 " style={{ animationDelay: '1.5s' }} />
				</div>

				{/* Bottom Right Area */}
				<div className="absolute bottom-12 right-16 text-[#ffd9b8] opacity-70">
					<FaTag className="w-9 h-9" style={{ animationDelay: '2s' }} />
				</div>

				{/* Additional floating icons for more visual interest */}
				<div className="absolute top-1/3 left-1/4 text-[#ffe6d0] opacity-40">
					<div
						className="w-6 h-6 bg-[#ff9b58] rounded-full "
						style={{ animationDelay: '0.8s' }}
					/>
				</div>

				<div className="absolute bottom-1/3 right-1/3 text-[#ffb88b] opacity-40">
					<div
						className="w-4 h-4 bg-[#ffd9b8] rounded-full "
						style={{ animationDelay: '1.2s' }}
					/>
				</div>
			</div>

			{/* Main Content - Perfectly Centered */}
			<div className="relative z-10 max-w-2xl w-full mx-auto px-6 text-center">
				{/* Brand Heading */}
				<div className="mb-12">
					<h1 className="font-dyna text-5xl lg:text-6xl text-neutral-900 inline-flex items-center justify-center gap-3 mb-3">
						<FaFire className="text-[#ff6b3d] w-12 h-12 " />
						Namey
					</h1>
					<p className="font-righteous text-base text-neutral-500">
						A tiny step to make Firechat feel like yours
					</p>
				</div>

				{/* Main Question */}
				<div className="mb-10">
					<h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
						Why should we call you?
					</h2>
					<p className="text-neutral-500 text-md font-righteous">
						Give us a goofy username that you will love to type.
					</p>
				</div>

				{/* Input Field */}
				<div className="mb-8">
					<FireInput
						variant="custom"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Please choose a goofy username"
					/>
				</div>

				{/* Pro Tip */}
				<div className="flex items-center justify-center gap-3 text-base text-neutral-500 mb-8">
					<FaLightbulb className="text-yellow-400 w-5 h-5 " />
					<span>Pro tip: keep it short and sticky — 1 or 2 words work best.</span>
				</div>

				{/* Step Counter */}
				<div className="flex items-center justify-center gap-3">
					<div className="w-3 h-3 rounded-full bg-[#ff9b58] " />
					<span className="text-sm text-neutral-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
