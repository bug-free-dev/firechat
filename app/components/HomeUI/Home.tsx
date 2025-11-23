'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { HiArrowRight } from 'react-icons/hi';
import {
	PiAt,
	PiChat,
	PiChatCircle,
	PiClock,
	PiCode,
	PiGlobe,
	PiHeart,
	PiLightning,
	PiLink,
	PiLock,
	PiMagicWand,
	PiMoon,
	PiPalette,
	PiRocketBold,
	PiShield,
	PiSparkle,
	PiSun,
	PiTag,
	PiTrendUp,
	PiUserCircle,
	PiUsers,
} from 'react-icons/pi';

import { FireHeader } from '@/app/components/UI';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';

export default function Home() {
	const [showConfetti, setShowConfetti] = useState(false);
	const { authState, isLoading } = useAuthState();
	const router = useRouter();
	const [redirecting, setRedirecting] = useState(false);
	const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		setWindowSize({ width: window.innerWidth, height: window.innerHeight });
		const handleResize = () =>
			setWindowSize({ width: window.innerWidth, height: window.innerHeight });
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		if (isLoading || redirecting) return;
		const timer = setTimeout(() => {
			setRedirecting(true);
			switch (authState) {
				case 'AUTHENTICATED':
					router.push('/desk');
					break;
				case 'NOT_ONBOARDED':
				case 'NEW_USER':
					router.push('/onboarding');
					break;
				default:
					router.push('/fireup');
					break;
			}
		}, 1000);
		return () => clearTimeout(timer);
	}, [authState, isLoading, router, redirecting]);

	const handleGetStarted = () => {
		toast.success('Welcome to Firechat!', {
			icon: '🚀',
			style: {
				borderRadius: '8px',
				background: '#000',
				color: '#fff',
				fontSize: '14px',
			},
		});
		setShowConfetti(true);
		setTimeout(() => setShowConfetti(false), 3000);
	};

	const icons = [
		PiChat,
		PiUsers,
		PiLock,
		PiSparkle,
		PiLightning,
		PiHeart,
		PiShield,
		PiMagicWand,
		PiGlobe,
		PiLink,
		PiCode,
		PiPalette,
		PiClock,
		PiTrendUp,
		PiMoon,
		PiSun,
		PiChatCircle,
		PiUserCircle,
		PiTag,
		PiAt,
	];

	return (
		<div className="relative min-h-screen bg-white">
			{showConfetti && (
				<Confetti
					width={windowSize.width}
					height={windowSize.height}
					recycle={false}
					numberOfPieces={200}
				/>
			)}

			<FireHeader />

			{/* Main Content */}
			<main className="relative z-10">
				{/* Hero Section */}
				<section className="px-4 sm:px-6 pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16">
					<div className="max-w-4xl mx-auto text-center">
						{/* Logo */}
						<div className="mb-8 inline-block">
							<Image src="/Firechat.svg" alt="Firechat" width={150} height={150} />
						</div>

						{/* Headline */}
						<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-neutral-900 mb-6">
							Small circles,
							<br />
							<span className="text-neutral-400">clear talk</span>
						</h1>

						{/* CTA */}
						<button
							onClick={handleGetStarted}
							className="group inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-neutral-800 transition-colors"
						>
							<PiRocketBold className="w-4 h-4" />
							<span>Get Started</span>
							<HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
						</button>
					</div>
				</section>

				{/* Divider Line */}
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
				</div>

				{/* Icon Grid Section */}
				<section className="px-4 sm:px-6 py-16 sm:py-24">
					<div className="max-w-3xl mx-auto">
						{/* Section Title */}
						<div className="text-center mb-12 sm:mb-16">
							<p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
								Everything you need
							</p>
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900">
								Built for conversation
							</h2>
						</div>

						{/* Icons Grid */}
						<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
							{icons.map((Icon, idx) => (
								<div
									key={idx}
									className="flex items-center justify-center "
									style={{
										animation: 'fadeIn 0.5s ease-out',
										animationDelay: `${idx * 30}ms`,
										animationFillMode: 'both',
									}}
								>
									<div className="relative group">
										<div className="absolute inset-0 bg-neutral-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
										<Icon className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400 group-hover:text-neutral-900 transition-colors relative z-10" />
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Divider Line */}
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
				</div>

				{/* Features List */}
				<section className="px-7 py-16 sm:py-24">
					<div className="max-w-3xl mx-auto">
						<div className="space-y-12">
							{/* Feature 1 */}
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
									<PiChat className="w-5 h-5 text-neutral-900" />
								</div>
								<div>
									<h3 className="text-lg font-medium text-neutral-900 mb-1">
										Threaded conversations
									</h3>
									<p className="text-neutral-600 text-sm leading-relaxed">
										Keep discussions organized with clean, nested threads that make
										following conversations effortless.
									</p>
								</div>
							</div>

							{/* Feature 2 */}
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
									<PiLock className="w-5 h-5 text-neutral-900" />
								</div>
								<div>
									<h3 className="text-lg font-medium text-neutral-900 mb-1">
										Private rooms
									</h3>
									<p className="text-neutral-600 text-sm leading-relaxed">
										Your conversations, your circle. Everything stays completely private
										and secure.
									</p>
								</div>
							</div>

							{/* Feature 3 */}
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
									<PiSparkle className="w-5 h-5 text-neutral-900" />
								</div>
								<div>
									<h3 className="text-lg font-medium text-neutral-900 mb-1">
										Playful reactions
									</h3>
									<p className="text-neutral-600 text-sm leading-relaxed">
										Express yourself naturally with intuitive reactions that add
										personality to every message.
									</p>
								</div>
							</div>

							{/* Feature 4 */}
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
									<PiUsers className="w-5 h-5 text-neutral-900" />
								</div>
								<div>
									<h3 className="text-lg font-medium text-neutral-900 mb-1">
										Small circles
									</h3>
									<p className="text-neutral-600 text-sm leading-relaxed">
										Focused groups that feel intimate and human, not overwhelming
										broadcast channels.
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Divider Line */}
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
				</div>

				{/* Final CTA */}
				<section className="px-4 sm:px-6 py-16 sm:py-24">
					<div className="max-w-2xl mx-auto text-center">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900 mb-4">
							Join the community
						</h2>
						<p className="text-lg text-neutral-600 mb-8">
							Focused rooms, zero clutter. Conversations that feel connected.
						</p>
						<button
							onClick={handleGetStarted}
							className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-neutral-800 transition-colors"
						>
							<span>Start chatting</span>
							<HiArrowRight className="w-4 h-4" />
						</button>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-neutral-200 py-8 px-4">
				<div className="max-w-6xl mx-auto text-center font-jolly">
					<p className="text-2xl text-neutral-500">
						Made with <span className="text-red-500">❤️</span> Thanks for being here.
					</p>
				</div>
			</footer>
		</div>
	);
}
