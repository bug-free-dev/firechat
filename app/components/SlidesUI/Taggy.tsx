'use client';

import React from 'react';
import {
	RiFlashlightLine,
	RiHashtag,
	RiPriceTag3Line,
	RiSparklingLine,
	RiStarLine,
	RiThumbUpLine,
} from 'react-icons/ri';

import { FireInput } from '@/app/components/UI';

type TaggyProps = {
	value: string[];
	onChange: (v: string[]) => void;
	step?: number;
	total?: number;
};

export function Taggy({ value, onChange, step = 5, total = 7 }: TaggyProps) {
	const [inputValue, setInputValue] = React.useState('');

	const addTag = (tag: string) => {
		const trimmed = tag.trim();
		if (trimmed && !value.includes(trimmed) && value.length < 5) {
			onChange([...value, trimmed]);
			setInputValue('');
		}
	};

	const removeTag = (tag: string) => {
		onChange(value.filter((t) => t !== tag));
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag(inputValue);
		}
	};

	const suggestedTags = [
		'creative',
		'funny',
		'chill',
		'energetic',
		'friendly',
		'smart',
		'adventurous',
		'artistic',
	];

	return (
		<div className="relative w-full h-full min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-lime-50/20 to-cyan-50/20">
			{/* Floating Icons */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[5%] left-[5%] text-lime-400/40">
					<RiHashtag className="w-12 h-12 animate-shimmer" />
				</div>
				<div className="absolute top-[8%] right-[10%] text-amber-400/35">
					<RiStarLine className="w-10 h-10 animate-float-elegant" />
				</div>
				<div className="absolute top-[16%] right-[22%] text-blue-400/30">
					<RiThumbUpLine className="w-8 h-8 animate-pulse-soft" />
				</div>
				<div className="absolute top-[50%] right-[5%] -translate-y-1/2 text-violet-400/35">
					<RiFlashlightLine
						className="w-9 h-9 animate-pulse-soft"
						style={{ animationDelay: '1s' }}
					/>
				</div>
				<div className="absolute bottom-[5%] right-[8%] text-pink-400/40">
					<RiSparklingLine
						className="w-10 h-10 animate-drift"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
			</div>

			{/* Main Content */}
			<div className="mt-3 relative z-10 max-w-3xl w-full mx-auto px-6 text-center animate-slide-up">
				<div className="mb-14">
					<h1 className="font-comic text-5xl lg:text-6xl text-slate-900 inline-flex items-center justify-center gap-3 mb-4">
						<RiPriceTag3Line className="text-lime-500 w-12 h-12 animate-pulse-soft" />
						Taggy
					</h1>
					<p className="font-righteous text-base text-slate-500">
						Add some tags to represent your personality
					</p>
				</div>

				<div className="mb-12">
					<h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-5">
						Pick your tags (max 5)
					</h2>
					<p className="text-base text-slate-600 mb-6">
						Tags help others understand your style, vibe, or interests.
					</p>

					{/* Input Field */}
					<div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
						<FireInput
							variant="custom"
							placeholder="Type a tag and hit enter"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyPress as React.KeyboardEventHandler<HTMLInputElement>}
							className="max-w-md mx-auto mb-6"
						/>
					</div>

					{/* Display Selected Tags */}
					<div
						className="flex flex-wrap justify-center gap-3 mb-6 animate-fade-in"
						style={{ animationDelay: '0.2s' }}
					>
						{value.map((tag) => (
							<div
								key={tag}
								className="flex items-center gap-2 bg-lime-500 text-white px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-all duration-200"
								onClick={() => removeTag(tag)}
							>
								{tag} <span className="text-lg leading-none">&times;</span>
							</div>
						))}
					</div>

					{/* Suggested Tags */}
					<div
						className="flex flex-wrap justify-center gap-3 animate-fade-in"
						style={{ animationDelay: '0.3s' }}
					>
						{suggestedTags.map((tag) => (
							<button
								key={tag}
								onClick={() => addTag(tag)}
								disabled={value.includes(tag) || value.length >= 5}
								className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
									value.includes(tag)
										? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
										: 'bg-white text-slate-700 border-slate-200 hover:border-lime-300 hover:shadow-sm'
								}`}
							>
								{tag}
							</button>
						))}
					</div>
				</div>

				{/* Footer */}
				<div
					className="flex items-center justify-center gap-3 text-base text-slate-500 mb-10 animate-fade-in"
					style={{ animationDelay: '0.4s' }}
				>
					<RiPriceTag3Line className="text-lime-500 w-5 h-5 animate-pulse-soft" />
					<span>Pro tip: pick tags that show off your personality!</span>
				</div>

				<div
					className="flex items-center justify-center gap-3 animate-fade-in"
					style={{ animationDelay: '0.5s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse-soft" />
					<span className="text-sm text-slate-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
