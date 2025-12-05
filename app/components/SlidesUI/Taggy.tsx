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
		<div className="relative w-full h-full min-h-[710px] flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[5%] left-[5%] text-lime-400/40 dark:text-lime-400/20">
					<RiHashtag className="w-12 h-12 animate-shimmer" />
				</div>
				<div className="absolute top-[8%] right-[10%] text-amber-400/35 dark:text-amber-400/15">
					<RiStarLine className="w-10 h-10 animate-float-elegant" />
				</div>
				<div className="absolute top-[16%] right-[22%] text-blue-400/30 dark:text-blue-400/15">
					<RiThumbUpLine className="w-8 h-8 animate-pulse-soft" />
				</div>
				<div className="absolute top-[50%] right-[5%] -translate-y-1/2 text-violet-400/35 dark:text-violet-400/15">
					<RiFlashlightLine
						className="w-9 h-9 animate-pulse-soft"
						style={{ animationDelay: '1s' }}
					/>
				</div>
				<div className="absolute bottom-[5%] right-[8%] text-pink-400/40 dark:text-pink-400/20">
					<RiSparklingLine
						className="w-10 h-10 animate-drift"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
			</div>

			<div className="mt-3 relative z-10 max-w-3xl w-full mx-auto px-6 text-center animate-fade-in-up">
				<div className="mb-14">
					<h1 className="font-bubblegum text-5xl lg:text-6xl text-zinc-900 dark:text-neutral-100 inline-flex items-center justify-center gap-3 mb-4">
						<RiPriceTag3Line className="text-lime-500 dark:text-lime-400 w-12 h-12 animate-pulse-soft" />
						Taggy
					</h1>
					<p className="font-righteous text-base text-zinc-500 dark:text-neutral-400">
						Add some tags to represent your personality
					</p>
				</div>

				<div className="mb-12">
					<h2 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-neutral-100 mb-5">
						Pick your tags (max 5)
					</h2>
					<p className="text-base text-zinc-600 dark:text-neutral-400 mb-6">
						Tags help others understand your style, vibe, or interests.
					</p>

					<div className="" style={{ animationDelay: '0.1s' }}>
						<FireInput
							variant="custom"
							placeholder="Type a tag and hit enter"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyPress as React.KeyboardEventHandler<HTMLInputElement>}
							className="max-w-md mx-auto mb-6"
						/>
					</div>

					<div
						className="flex flex-wrap justify-center gap-3 mb-6 "
						style={{ animationDelay: '0.2s' }}
					>
						{value.map((tag) => (
							<div
								key={tag}
								className="flex items-center gap-2 bg-lime-500 dark:bg-lime-600 text-white px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-all duration-200"
								onClick={() => removeTag(tag)}
							>
								{tag} <span className="text-lg leading-none">&times;</span>
							</div>
						))}
					</div>

					<div
						className="flex flex-wrap justify-center gap-3 "
						style={{ animationDelay: '0.3s' }}
					>
						{suggestedTags.map((tag) => (
							<button
								key={tag}
								onClick={() => addTag(tag)}
								disabled={value.includes(tag) || value.length >= 5}
								className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
									value.includes(tag)
										? 'bg-zinc-100 dark:bg-neutral-800 text-zinc-400 dark:text-neutral-500 border-zinc-200 dark:border-neutral-700/40 cursor-not-allowed'
										: 'bg-white dark:bg-neutral-950 text-zinc-700 dark:text-neutral-300 border-zinc-200 dark:border-neutral-700/40 hover:border-lime-300 dark:hover:border-lime-600/60'
								}`}
							>
								{tag}
							</button>
						))}
					</div>
				</div>

				<div
					className="flex items-center justify-center gap-3 text-base text-zinc-500 dark:text-neutral-400 mb-10 "
					style={{ animationDelay: '0.4s' }}
				>
					<RiPriceTag3Line className="text-lime-500 dark:text-lime-400 w-5 h-5 animate-pulse-soft" />
					<span>Pro tip: pick tags that show off your personality!</span>
				</div>

				<div
					className="flex items-center justify-center gap-3 mb-5"
					style={{ animationDelay: '0.5s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-lime-500 dark:bg-lime-400 animate-pulse-soft " />
					<span className="text-sm text-zinc-500 dark:text-neutral-400 font-medium ">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
