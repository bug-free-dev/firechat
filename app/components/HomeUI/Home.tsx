'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

import { FireHeader } from '@/app/components/UI';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import { AuthState } from '@/app/lib/routing/helpers/compute';

import { CTASection } from './CTASection';
import { FeaturesSection } from './Features';
import { Footer } from './Footer';
import { HeroSection } from './Hero';
import { IconGrid } from './IconGrid';

export default function Home() {
	const router = useRouter();
	const { authState, isLoading: authLoading } = useAuthState();

	const [showConfetti, setShowConfetti] = useState(false);
	const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
	const [isNavigating, setIsNavigating] = useState(false);
	const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

	useEffect(() => {
		setWindowSize({ width: window.innerWidth, height: window.innerHeight });
		const handleResize = () =>
			setWindowSize({ width: window.innerWidth, height: window.innerHeight });
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleGetStarted = useCallback(() => {
		if (isNavigating || authLoading) return;

		setIsNavigating(true);

		switch (authState) {
			case AuthState.AUTHENTICATED:
				toast.success('Welcome back!', { icon: '👋' });
				router.push('/desk');
				break;

			case AuthState.NEW_USER:
			case AuthState.NOT_ONBOARDED:
				toast.success('Lets set up your profile!', { icon: '✨' });
				router.push('/onboarding');
				break;

			case AuthState.UNVERIFIED:
				toast.error('Please verify your email first', { icon: '📧' });
				router.push('/fireup');
				break;

			case AuthState.BANNED:
				toast.error('Account suspended', { icon: '🚫' });
				setIsNavigating(false);
				break;

			case AuthState.UNAUTHENTICATED:
			case AuthState.LOADING:
			default:
				toast.success('Welcome to Firechat!', { icon: '🚀' });
				setShowConfetti(true);
				setTimeout(() => setShowConfetti(false), 3000);
				router.push('/fireup');
				break;
		}
	}, [authState, authLoading, isNavigating, router]);

	useEffect(() => {
		if (authLoading || hasCheckedAuth) return;

		setHasCheckedAuth(true);

		if (authState === AuthState.AUTHENTICATED) {
			const timer = setTimeout(() => {
				router.push('/desk');
			}, 100);
			return () => clearTimeout(timer);
		}

		if (authState === AuthState.NOT_ONBOARDED || authState === AuthState.NEW_USER) {
			const timer = setTimeout(() => {
				router.push('/onboarding');
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [authState, authLoading, hasCheckedAuth, router]);

	return (
		<div className="relative bg-white dark:bg-neutral-900 transition-colors duration-300">
			{showConfetti && (
				<Confetti
					width={windowSize.width}
					height={windowSize.height}
					recycle={false}
					numberOfPieces={200}
				/>
			)}

			<FireHeader />

			<main className="relative z-10">
				<HeroSection onGetStarted={handleGetStarted} isNavigating={isNavigating} />

				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />
				</div>

				<IconGrid />

				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />
				</div>

				<FeaturesSection />

				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />
				</div>

				<CTASection onGetStarted={handleGetStarted} isNavigating={isNavigating} />
			</main>

			<Footer />
		</div>
	);
}
