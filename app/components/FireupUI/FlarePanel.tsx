'use client';

import React from 'react';
import { FiLock, FiStar, FiUsers, FiGift } from 'react-icons/fi';
import { BiRocket } from 'react-icons/bi';

export default function FlarePanel() {
	const features = [
		{
			icon: <FiGift className="text-yellow-500 w-6 h-6" />,
			title: 'Kudos',
			desc: 'Earn & spend playful perks',
		},
		{
			icon: <FiUsers className="text-orange-500 w-6 h-6" />,
			title: 'Invite-only',
			desc: 'Join rooms using secret codes',
		},
		{
			icon: <FiStar className="text-pink-500 w-6 h-6" />,
			title: 'Fun & Safe',
			desc: 'Playful rules, zero toxicity',
		},
		{
			icon: <FiLock className="text-purple-500 w-6 h-6" />,
			title: 'Identifier',
			desc: 'A secret ID only you know',
		},
	];

	return (
		<div className="max-w-md mx-auto space-y-8 px-4">
			{/* Heading */}
			<div className="text-center space-y-4">
				<h2 className="font-bold text-3xl text-neutral-800 dark:text-neutral-100">
					Private & Playful & Amazing.
				</h2>
				<p className="text-sm text-neutral-500 dark:text-neutral-300 leading-relaxed">
					Firechat is your invite-only chat app — secret rooms, tiny Kudos economy, and a
					respectful vibe.
				</p>
				<div className="flex justify-center gap-2">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="w-2 h-2 rounded-full bg-[#ff3e00] animate-bounce"
							style={{ animationDelay: `${i * 200}ms` }}
						/>
					))}
				</div>
			</div>

			{/* Features grid */}
			<div className="grid grid-cols-2 gap-4">
				{features.map((feature) => (
					<div
						key={feature.title}
						className="p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-left group transition duration-300 ease-in-out hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
					>
						{/* Inner content flex: column by default, row on small screens */}
						<div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
							<div className="p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/10 dark:group-hover:bg-neutral-600/10">
								{feature.icon}
							</div>

							<div>
								<div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#ff3e00] transition-colors duration-200 text-center">
									{feature.title}
								</div>
								<div className="text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-600 transition-colors duration-200 text-center">
									{feature.desc}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Pro tip */}
			<div className="text-center p-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 rounded-t-lg border border-orange-200/50 dark:border-orange-900/30">
				<div className="text-xs text-neutral-600 dark:text-neutral-300 mb-3 flex items-center justify-center gap-2">
					<BiRocket className="text-[#ff3e00] w-4 h-4" />
					<span className="font-medium">Pro tip</span>
				</div>
				<p className="text-xs text-neutral-700 dark:text-neutral-200">
					A short identifier (like{' '}
					<span className="font-semibold text-[#ff3e00] bg-white px-2 py-0.5 rounded-md shadow-sm dark:bg-neutral-800">
						You@Firechat69
					</span>
					) makes joining faster.
				</p>
			</div>
		</div>
	);
}
