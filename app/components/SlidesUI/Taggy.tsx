'use client';

import React from 'react';
import { FaBolt, FaHashtag, FaMagic, FaStar, FaTag, FaThumbsUp } from 'react-icons/fa';

import FireInput from '@/app/components/UI/FireInput';

type Props = {
	value: string[];
	onChange: (v: string[]) => void;
	step?: number;
	total?: number;
};

export default function Taggy({ value, onChange, step = 5, total = 7 }: Props) {
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
		<div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden">
			{/* Floating icons */}
			<div className="absolute inset-0 pointer-events-none">
				{/* Top-left */}
				<div className="absolute -top-1 left-4 md:left-8 text-lime-400 opacity-70">
					<FaHashtag className="w-10 h-10 md:w-12 md:h-12 animate-pulse" />
				</div>

				{/* Top-right */}
				<div className="absolute top-5 right-4 md:right-12 text-[#f59e0b] opacity-60">
					<FaStar className="w-8 h-8 md:w-10 md:h-10 animate-float" />
				</div>

				{/* Center-top-right */}
				<div className="absolute top-1/6 right-1/4 md:right-1/4 text-[#3b82f6] opacity-50">
					<FaThumbsUp className="w-6 h-6 md:w-8 md:h-8 animate-pulse" />
				</div>

				{/* Middle-right */}
				<div className="absolute top-1/2 right-4 md:right-8 transform -translate-y-1/2 text-[#8b5cf6] opacity-50">
					<FaBolt
						className="w-7 h-7 md:w-9 md:h-9 animate-pulse"
						style={{ animationDelay: '1s' }}
					/>
				</div>

				{/* Bottom-left */}
				<div className="absolute bottom-0 left-4 md:left-50 text-[#ec4899] opacity-60">
					<FaMagic
						className="w-8 h-8 md:w-10 md:h-10 animate-float"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
			</div>

			{/* Main content */}
			<div className="relative z-10 max-w-3xl w-full mx-auto px-6 text-center">
				<div className="mb-12">
					<h1 className="font-dyna text-5xl lg:text-6xl text-neutral-900 inline-flex items-center justify-center gap-3 mb-3">
						<FaTag className="text-lime-400 w-12 h-12 animate-pulse" />
						Taggy
					</h1>
					<p className="font-righteous text-base text-neutral-500">
						Add some tags to represent your personality
					</p>
				</div>

				<div className="mb-10">
					<h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
						Pick your tags (max 5)
					</h2>
					<p className="text-lg text-neutral-600 mb-4">
						Tags help others understand your style, vibe, or interests.
					</p>

					{/* Input Field using custom component */}
					<FireInput
						variant="custom"
						placeholder="Type a tag and hit enter"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyPress as React.KeyboardEventHandler<HTMLInputElement>}
						className="max-w-md mx-auto mb-4"
					/>

					{/* Display selected tags */}
					<div className="flex flex-wrap justify-center gap-3 mb-4">
						{value.map((tag) => (
							<div
								key={tag}
								className="flex items-center gap-2 bg-lime-400 text-white px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition"
								onClick={() => removeTag(tag)}
							>
								{tag} &times;
							</div>
						))}
					</div>

					{/* Suggested tags */}
					<div className="flex flex-wrap justify-center gap-3">
						{suggestedTags.map((tag) => (
							<button
								key={tag}
								onClick={() => addTag(tag)}
								disabled={value.includes(tag) || value.length >= 5}
								className={`px-3 py-1 rounded-full border border-neutral-300 text-sm font-medium transition hover:scale-105 ${
									value.includes(tag)
										? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
										: 'bg-white text-neutral-800'
								}`}
							>
								{tag}
							</button>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-center gap-3 text-base text-neutral-500 mb-8">
					<FaTag className="text-green-500 w-5 h-5 animate-pulse" />
					<span>Pro tip: pick tags that show off your personality!</span>
				</div>

				<div className="flex items-center justify-center gap-3">
					<div className="w-3 h-3 rounded-full bg-lime-400 animate-pulse" />
					<span className="text-sm text-neutral-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
