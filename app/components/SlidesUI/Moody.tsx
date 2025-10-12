'use client';

import React from 'react';
import { FaAngry, FaGrinStars, FaHeart, FaLaugh, FaMeh, FaSmile, FaSurprise } from 'react-icons/fa';

type Props = {
	value: string;
	onChange: (v: string) => void;
	step?: number;
	total?: number;
};

export default function Moody({ value, onChange, step = 3, total = 7 }: Props) {
	const moods = [
		{ emoji: '😊', label: 'Happy', color: '#fbbf24' },
		{ emoji: '😎', label: 'Cool', color: '#3b82f6' },
		{ emoji: '🤗', label: 'Friendly', color: '#10b981' },
		{ emoji: '😴', label: 'Chill', color: '#8b5cf6' },
		{ emoji: '🤪', label: 'Goofy', color: '#f59e0b' },
		{ emoji: '😇', label: 'Innocent', color: '#f472b6' },
		{ emoji: '🥰', label: 'Loving', color: '#ec4899' },
		{ emoji: '🤔', label: 'Thoughtful', color: '#6366f1' },
	];

	return (
		<div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden">
			{/* Colorful floating emojis */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-12 right-12 text-[#ef4444] opacity-60">
					<FaHeart className="w-10 h-10 " />
				</div>
				<div className="absolute top-20 right-1/4 text-[#10b981] opacity-50">
					<FaLaugh className="w-8 h-8 animate-float" style={{ animationDelay: '0.3s' }} />
				</div>
				<div className="absolute top-1/2 left-6 transform -translate-y-1/2 text-[#8b5cf6] opacity-60">
					<FaSurprise className="w-11 h-11 " style={{ animationDelay: '0.5s' }} />
				</div>
				<div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-[#f59e0b] opacity-50">
					<FaGrinStars className="w-9 h-9 animate-float" style={{ animationDelay: '1s' }} />
				</div>
				<div className="absolute bottom-16 left-12 text-[#06b6d4] opacity-60">
					<FaMeh className="w-10 h-10 " style={{ animationDelay: '1.5s' }} />
				</div>
				<div className="absolute bottom-12 right-16 text-[#ec4899] opacity-70">
					<FaAngry className="w-9 h-9 animate-float" style={{ animationDelay: '2s' }} />
				</div>
			</div>

			<div className="relative z-10 max-w-2xl w-full mx-auto px-6 text-center">
				<div className="mb-12">
					<h1 className="font-dyna text-5xl lg:text-6xl text-neutral-900 inline-flex items-center justify-center gap-3 mb-3">
						<FaSmile className="text-[#fbbf24] w-12 h-12 animate-float" />
						Moody
					</h1>
					<p className="font-righteous text-base text-neutral-500">
						Express your vibe to the world
					</p>
				</div>

				<div className="mb-10">
					<h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
						What is your usual mood?
					</h2>
					<p className="text-lg text-neutral-600">
						Pick the vibe that represents you best in chats.
					</p>
				</div>

				<div className="mb-8">
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
						{moods.map((mood, _) => (
							<button
								key={mood.label}
								onClick={() => onChange(mood.label)}
								className={`
                  p-4 rounded-t-lg border-2 transition-all duration-300 hover:scale-105
                  ${
							value === mood.label
								? 'border-current shadow-lg scale-105'
								: 'border-neutral-200 hover:border-neutral-300'
						}
                `}
								style={{
									color: value === mood.label ? mood.color : '#6b7280',
									backgroundColor:
										value === mood.label ? `${mood.color}10` : 'transparent',
								}}
							>
								<div className="text-3xl mb-2">{mood.emoji}</div>
								<div className="text-sm font-medium">{mood.label}</div>
							</button>
						))}
					</div>
				</div>

				<div className="flex items-center justify-center gap-3 text-base text-neutral-500 mb-8">
					<FaHeart className="text-pink-500 w-5 h-5 " />
					<span>Pro tip: your mood helps others vibe with you better!</span>
				</div>

				<div className="flex items-center justify-center gap-3">
					<div className="w-3 h-3 rounded-full bg-[#fbbf24] " />
					<span className="text-sm text-neutral-500 font-medium mb-2">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
