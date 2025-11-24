'use client';

import React from 'react';
import {
	RiEmotionHappyLine,
	RiHashtag,
	RiHeart3Line,
	RiInformationLine,
	RiQuillPenLine,
	RiSparklingLine,
	RiStarLine,
	RiUserLine,
} from 'react-icons/ri';

import { FireArea, FireInput } from '@/app/components/UI';

export interface Profile {
	status?: string;
	about?: string;
	avatarUrl?: string | null;
}

type PickyProps = {
	value?: Profile;
	onChange: (v: Profile) => void;
	step?: number;
	total?: number;
};

export function Picky({ value, onChange, step = 1, total = 1 }: PickyProps) {
	const { status = '', about = '' } = value || {};

	return (
		<div className="relative w-full flex flex-col items-center justify-center px-6 py-10 bg-white dark:bg-neutral-900 overflow-hidden">
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<RiStarLine className="absolute top-[12%] left-[8%] w-7 h-7 text-amber-400/40 dark:text-amber-400/20 animate-float-elegant" />
				<RiHeart3Line className="absolute top-[25%] right-[12%] w-7 h-7 text-pink-400/40 dark:text-pink-400/20 animate-pulse-soft" />
				<RiEmotionHappyLine className="absolute bottom-[18%] left-[10%] w-9 h-9 text-lime-400/35 dark:text-lime-400/15 animate-drift" />
				<RiSparklingLine className="absolute bottom-[28%] right-[15%] w-6 h-6 text-violet-400/35 dark:text-violet-400/15 animate-pulse-soft" />
			</div>

			<div className="w-full max-w-2xl space-y-10 relative z-10 animate-fade-in-up">
				<div className="text-center">
					<h1 className="font-bubblegum mb-7 text-4xl font-semibold text-zinc-900 dark:text-neutral-100 flex items-center justify-center gap-3">
						<RiUserLine className="text-rose-500 dark:text-rose-400" />
						Picky
					</h1>
					<p className="font-righteous text-sm text-zinc-500 dark:text-neutral-400 mt-1 flex items-center justify-center gap-2">
						<RiEmotionHappyLine className="text-amber-500 dark:text-amber-400" />
						Personalize your profile & show your vibe
					</p>
				</div>

				<div className="space-y-3 " style={{ animationDelay: '0.1s' }}>
					<label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-neutral-300">
						<RiHashtag className="text-blue-500 dark:text-blue-400" />
						Current Status
					</label>
					<FireInput
						variant="custom"
						value={status}
						onChange={(e) => onChange({ ...value, status: e.target.value })}
						placeholder="What are you currently up to? (e.g., Studying, Gaming, Chilling...)"
						required
					/>
				</div>

				<div className="space-y-3 " style={{ animationDelay: '0.2s' }}>
					<label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-neutral-300">
						<RiInformationLine className="text-emerald-500 dark:text-emerald-400" />
						About You
					</label>
					<div className="relative">
						<FireArea
							value={about}
							onChange={(e) => onChange({ ...value, about: e.target.value })}
							placeholder="A short tagline or fun bio..."
							rows={4}
							variant="custom"
							className="text-base"
						/>
						<RiQuillPenLine className="absolute right-3 top-3 text-zinc-400 dark:text-neutral-500 pointer-events-none w-4 h-4" />
					</div>
				</div>

				<div
					className="flex items-center justify-center gap-3 pt-6 "
					style={{ animationDelay: '0.3s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse-soft" />
					<span className="text-sm text-zinc-500 dark:text-neutral-400 font-medium flex items-center gap-2">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
