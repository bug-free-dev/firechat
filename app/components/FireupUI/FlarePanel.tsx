'use client';

import React from 'react';
import { BiRocket } from 'react-icons/bi';
import { FiGift, FiLock, FiStar, FiUsers } from 'react-icons/fi';

export default function FlarePanel() {
	const features = [
		{
			icon: <FiGift className="text-yellow-500/70 dark:text-yellow-300/70 w-6 h-6" />,
			title: 'Kudos',
			desc: 'Earn & spend playful perks',
		},
		{
			icon: <FiUsers className="text-orange-500/70 dark:text-orange-300/70 w-6 h-6" />,
			title: 'Invite-only',
			desc: 'Join rooms using secret codes',
		},
		{
			icon: <FiStar className="text-pink-500/70 dark:text-pink-300/70 w-6 h-6" />,
			title: 'Fun & Safe',
			desc: 'Playful rules, zero toxicity',
		},
		{
			icon: <FiLock className="text-purple-500/70 dark:text-purple-300/70 w-6 h-6" />,
			title: 'Identifier',
			desc: 'A secret ID only you know',
		},
	];

	return (
		<div className="max-w-md mx-auto space-y-8 px-4">
			{/* Heading */}
			<div className="text-center space-y-4">
				<h2 className="font-bold text-3xl text-neutral-800 dark:text-neutral-100 font-bubblegum">
					Your spark, your circle.
				</h2>
				<p className="text-sm text-neutral-500 dark:text-neutral-300 leading-relaxed">
					An invite-only chat app for close circles, secret rooms, and real conversations.
				</p>

				<div className="flex justify-center gap-2">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="w-2 h-2 rounded-full border-1 border-neutral-400 dark:border-neutral-600 animate-bounce"
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
						className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-700/40 text-left group transition duration-300 ease-in-out hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
					>
						<div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
							<div className="p-2 rounded-xl transition-colors duration-300 group-hover:bg-white/10 dark:group-hover:bg-neutral-700/10">
								{feature.icon}
							</div>

							<div>
								<div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-500 dark:group-hover:text-neutral-300 transition-colors duration-200 text-center">
									{feature.title}
								</div>
								<div className="text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200 text-center">
									{feature.desc}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Pro tip */}
			<div className="text-center p-2 rounded-xl ring-2 ring-neutral-300/50 dark:ring-neutral-700/50">
				<div className="text-xs text-neutral-700 dark:text-neutral-200 mb-3 flex items-center justify-center gap-2">
					<BiRocket className="text-neutral-500 dark:text-neutral-300 w-4 h-4" />
					<span className="font-medium">Pro tip</span>
				</div>

				<p className="text-xs text-neutral-700 dark:text-neutral-200">
					A short identifier (like{' '}
					<span className="font-semibold text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-neutral-950/40 px-2 py-0.5 rounded-md shadow-sm">
						You@Firechat69
					</span>
					) makes joining faster.
				</p>
			</div>
		</div>
	);
}
