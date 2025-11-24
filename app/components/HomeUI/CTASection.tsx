'use client';

import { HiArrowRight } from 'react-icons/hi';

import { FireButton } from '../UI';

interface CTASectionProps {
	onGetStarted: () => void;
	isNavigating: boolean;
}

export function CTASection({ onGetStarted, isNavigating }: CTASectionProps) {
	return (
		<section className="px-4 sm:px-6 py-16 sm:py-24">
			<div className="max-w-2xl mx-auto text-center">
				<h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 transition-colors duration-300">
					Join the community
				</h2>
				<p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 transition-colors duration-300">
					Focused rooms, zero clutter. Conversations that feel connected.
				</p>
				<FireButton
					onClick={onGetStarted}
					disabled={isNavigating}
					size="lg"
					loading={isNavigating}
					variant="default"
				>
					Start chatting
					{!isNavigating && <HiArrowRight className="w-4 h-4 ml-1" />}
				</FireButton>
			</div>
		</section>
	);
}
