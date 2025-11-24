'use client';

import Image from 'next/image';
import { HiArrowRight } from 'react-icons/hi';
import { PiRocketBold } from 'react-icons/pi';

import { FireButton } from '../UI';

interface HeroSectionProps {
	onGetStarted: () => void;
	isNavigating: boolean;
}

export function HeroSection({ onGetStarted, isNavigating }: HeroSectionProps) {
	return (
		<section className="px-4 sm:px-6 pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16">
			<div className="max-w-4xl mx-auto text-center">
				<div className="mb-8 inline-block">
					<Image
						src="/Firechat.svg"
						alt="Firechat"
						width={150}
						height={150}
						className="dark:brightness-110"
					/>
				</div>

				<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6 transition-colors duration-300">
					Small circles,
					<br />
					<span className="text-neutral-400 dark:text-neutral-600">clear talk</span>
				</h1>

				<FireButton
					onClick={onGetStarted}
					disabled={isNavigating}
					size="lg"
					variant="default"
					icon={<PiRocketBold className="w-4 h-4" />}
					iconPosition="left"
					loading={isNavigating}
				>
					Get Started
					{!isNavigating && (
						<HiArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
					)}
				</FireButton>
			</div>
		</section>
	);
}
