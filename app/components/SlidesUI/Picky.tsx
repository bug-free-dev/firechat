'use client';

import React from 'react';
import {
	FaHashtag,
	FaHeart,
	FaInfoCircle,
	FaPen,
	FaSmile,
	FaStar,
	FaUserAlt,
} from 'react-icons/fa';

import FireInput from '@/app/components/UI/FireInput';
import FireArea from '../UI/FireArea';

export interface Profile {
	status?: string;
	about?: string;
	avatarUrl?: string | null;
}

type Props = {
	value?: Profile;
	onChange: (v: Profile) => void;
	step?: number;
	total?: number;
};

export default function Picky({ value, onChange, step = 1, total = 1 }: Props) {
	const { status = '', about = '' } = value || {};

	return (
		<div className="relative w-full flex flex-col items-center justify-center px-6 py-10 bg-white overflow-hidden">
			{/* Floating Icons */}
			<FaStar className="absolute top-16 left-10 w-6 h-6 text-yellow-400 animate-float opacity-50" />
			<FaHeart className="absolute top-1/4 right-16 w-6 h-6 text-pink-400 animate-pulse opacity-50" />
			<FaSmile className="absolute bottom-20 left-12 w-8 h-8 text-lime-400 animate-float-slow opacity-40" />
			<FaStar className="absolute bottom-32 right-20 w-5 h-5 text-yellow-300 animate-float-slow opacity-40" />

			<div className="w-full max-w-2xl space-y-10 relative z-10">
				{/* Heading */}
				<div className="text-center">
					<h1 className="font-dyna mb-7 text-4xl font-semibold text-neutral-800 flex items-center justify-center gap-3">
						<FaUserAlt className="text-[#ff3e00]" />
						Picky
					</h1>
					<p className="font-righteous text-sm text-neutral-500 mt-2 flex items-center justify-center gap-2">
						<FaSmile className="text-yellow-500" />
						Personalize your profile & show your vibe
					</p>
				</div>

				{/* Status */}
				<div className="space-y-3">
					<label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
						<FaHashtag className="text-blue-500" />
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

				{/* About */}
				<div className="space-y-3">
					<label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
						<FaInfoCircle className="text-lime-400" />
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

						<FaPen className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
					</div>
				</div>

				{/* Step indicator */}
				<div className="flex items-center justify-center gap-3 pt-6">
					<div className="w-3 h-3 rounded-full bg-[#ff3e00] animate-pulse" />
					<span className="text-sm text-neutral-500 font-medium flex items-center gap-2">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
