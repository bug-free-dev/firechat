'use client';

import Image from 'next/image';
import React from 'react';
import { FaLock, FaMagic, FaStar, FaUsers } from 'react-icons/fa';

export default function FlarePanel() {
	return (
		<div className="max-w-md mx-auto space-y-8">
			<div className="text-center space-y-4">
				<h2 className="font-dyna font-bold text-3xl text-neutral-800 dark:text-neutral-100">
					Private & Playful & Amazing.
				</h2>
				<p className="font-righteous text-sm text-neutral-500 dark:text-neutral-300 leading-relaxed">
					Firechat is your invite-only chat app — secret rooms, tiny Kudos economy, and a
					respectful vibe.
				</p>
				<div className="flex justify-center gap-2">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className={`w-2 h-2 rounded-full bg-[#ff3e00] `}
							style={{ animationDelay: `${i * 200}ms` }}
						/>
					))}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				{[
					{
						icon: (
							<Image
								src="/assets/Kudos.svg"
								alt="Kudos"
								height={80}
								width={80}
								className="text-[#ff3e00]"
							/>
						),
						title: 'Kudos',
						desc: 'Earn & spend playful perks',
					},
					{
						icon: <FaUsers className="text-[#ff3e00]" />,
						title: 'Invite-only',
						desc: 'Join rooms using secret codes',
					},
					{
						icon: <FaStar className="text-[#ff3e00]" />,
						title: 'Fun & Safe',
						desc: 'Playful rules, zero toxicity',
					},
					{
						icon: <FaLock className="text-[#ff3e00]" />,
						title: 'Identifier',
						desc: 'A secret ID only you know',
					},
				].map((c) => (
					<div
						key={c.title}
						className="p-4 rounded-t-lg bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 hover:border-orange-200 text-left group cursor-pointer transition-all duration-500 hover:shadow-sm hover:-translate-y-1"
					>
						<div className="flex items-center gap-3">
							<div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-t-lg group-hover:scale-105 transition-all duration-300 dark:from-orange-900/20 dark:to-red-900/10">
								{c.icon}
							</div>
							<div>
								<div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#ff3e00] transition-colors duration-200">
									{c.title}
								</div>
								<div className="text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-600 transition-colors duration-200">
									{c.desc}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 rounded-t-lg border border-orange-200/50 dark:border-orange-900/30">
				<div className="text-xs text-neutral-600 dark:text-neutral-300 mb-2 flex items-center justify-center gap-2">
					<FaMagic className="text-[#ff3e00]" />
					<span className="font-medium">Pro tip</span>
				</div>
				<p className="text-xs text-neutral-700 dark:text-neutral-200">
					A short identifier (like{' '}
					<span className="font-semibold text-[#ff3e00] bg-white px-2 py-0.5 rounded-md shadow-sm dark:bg-neutral-800">
						You@Firechat
					</span>
					) makes joining faster.
				</p>
			</div>
		</div>
	);
}
