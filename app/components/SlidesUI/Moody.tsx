'use client';

import React from 'react';
import {
	RiEmotionHappyLine,
	RiEmotionLine,
	RiHeart3Line,
	RiSparklingLine,
	RiSunLine,
} from 'react-icons/ri';

type MoodyProps = {
	value: string;
	onChange: (v: string) => void;
	step?: number;
	total?: number;
};

export function Moody({ value, onChange, step = 3, total = 7 }: MoodyProps) {
	const moods = [
		{ emoji: '😊', label: 'Happy', color: '#f59e0b' },
		{ emoji: '😎', label: 'Cool', color: '#3b82f6' },
		{ emoji: '🤗', label: 'Friendly', color: '#10b981' },
		{ emoji: '😴', label: 'Chill', color: '#8b5cf6' },
		{ emoji: '🤪', label: 'Goofy', color: '#f97316' },
		{ emoji: '😇', label: 'Innocent', color: '#ec4899' },
		{ emoji: '🥰', label: 'Loving', color: '#ef4444' },
		{ emoji: '🤔', label: 'Thoughtful', color: '#6366f1' },
	];

	return (
		<div className="relative w-full h-full min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50/20 to-rose-50/20">
			{/* Floating Emojis */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[10%] right-[10%] text-rose-400/40">
					<RiHeart3Line className="w-11 h-11 animate-pulse-soft" />
				</div>
				<div className="absolute top-[20%] left-[22%] text-emerald-400/35">
					<RiEmotionHappyLine
						className="w-9 h-9 animate-float-elegant"
						style={{ animationDelay: '0.3s' }}
					/>
				</div>
				<div className="absolute top-[50%] left-[5%] -translate-y-1/2 text-violet-400/40">
					<RiSparklingLine
						className="w-12 h-12 animate-drift"
						style={{ animationDelay: '0.5s' }}
					/>
				</div>
				<div className="absolute top-[50%] right-[6%] -translate-y-1/2 text-amber-400/35">
					<RiSunLine
						className="w-10 h-10 animate-float-elegant"
						style={{ animationDelay: '1s' }}
					/>
				</div>
				<div className="absolute bottom-[14%] left-[10%] text-sky-400/40">
					<RiEmotionLine
						className="w-11 h-11 animate-pulse-soft"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
				<div className="absolute bottom-[10%] right-[13%] text-pink-400/40">
					<RiHeart3Line className="w-10 h-10 animate-drift" style={{ animationDelay: '2s' }} />
				</div>
			</div>

			<div className="mt-3 relative z-10 max-w-2xl w-full mx-auto px-6 text-center animate-fade-in-up">
				<div className="mb-10">
					<h1 className="font-dyna text-5xl lg:text-6xl text-slate-900 inline-flex items-center justify-center gap-3 mb-4">
						<RiEmotionHappyLine className="text-amber-500 w-12 h-12 animate-pulse-soft" />
						Moody
					</h1>
					<p className="font-righteous text-base text-slate-500">
						Express your vibe to the world
					</p>
				</div>

				<div className="mb-12">
					<h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-5">
						What is your usual mood?
					</h2>
					<p className="text-base text-slate-600">
						Pick the vibe that represents you best in chats.
					</p>
				</div>

				<div className="mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
						{moods.map((mood) => (
							<button
								key={mood.label}
								onClick={() => onChange(mood.label)}
								className={`
                  p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5
                  ${
							value === mood.label
								? 'border-current shadow-lg shadow-current/10 scale-105'
								: 'border-slate-200 hover:border-slate-300 hover:shadow-md'
						}
                `}
								style={{
									color: value === mood.label ? mood.color : '#64748b',
									backgroundColor:
										value === mood.label ? `${mood.color}08` : 'rgba(255, 255, 255, 0.8)',
								}}
							>
								<div className="text-3xl mb-2.5">{mood.emoji}</div>
								<div className="text-sm font-medium">{mood.label}</div>
							</button>
						))}
					</div>
				</div>

				<div
					className="flex items-center justify-center gap-3 text-base text-slate-500 mb-10 animate-fade-in"
					style={{ animationDelay: '0.2s' }}
				>
					<RiHeart3Line className="text-pink-500 w-5 h-5 animate-pulse-soft" />
					<span>Pro tip: your mood helps others vibe with you better!</span>
				</div>

				<div
					className="mb-5 flex items-center justify-center gap-3 animate-fade-in"
					style={{ animationDelay: '0.3s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse-soft" />
					<span className="text-sm text-slate-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
