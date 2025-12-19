'use client';

import { PiChat, PiLock, PiSparkle, PiUsers } from 'react-icons/pi';

const features = [
	{
		icon: PiChat,
		title: 'Threaded conversations',
		description:
			'Keep discussions organized with clean, nested threads that make following conversations effortless.',
	},
	{
		icon: PiLock,
		title: 'Private rooms',
		description:
			'Your conversations, your circle. Everything stays completely private and secure.',
	},
	{
		icon: PiSparkle,
		title: 'Playful reactions',
		description:
			'Express yourself naturally with intuitive reactions that add personality to every message.',
	},
	{
		icon: PiUsers,
		title: 'Small circles',
		description:
			'Focused groups that feel intimate and human, not overwhelming broadcast channels.',
	},
];

export function FeaturesSection() {
	return (
		<section className="px-7 py-16 sm:py-24">
			<div className="max-w-3xl mx-auto">
				<div className="space-y-12">
					{features.map((feature, idx) => {
						const Icon = feature.icon;
						return (
							<div key={idx} className="flex items-start gap-4">
								<div className="flex-shrink-0 w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center transition-colors duration-300">
									<Icon className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
								</div>
								<div>
									<h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-1 transition-colors duration-300">
										{feature.title}
									</h3>
									<p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed transition-colors duration-300">
										{feature.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
