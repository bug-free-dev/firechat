'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { HiOutlineEmojiHappy, HiOutlineLightningBolt } from 'react-icons/hi';
import { PiRocketBold } from 'react-icons/pi';
import { RiChat3Line, RiFireLine, RiGiftLine, RiUser3Line } from 'react-icons/ri';

import { FireHeader } from '@/app/components/UI';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';

import { MinimalIcon } from './MinimalIcon';

const FEATURES = [
	{
		icon: <HiOutlineLightningBolt />,
		label: 'Fast',
		tagline: 'Lightning Speed',
		bg: 'bg-yellow-50/70',
		txt: 'text-yellow-600/70',
	},
	{
		icon: <RiChat3Line />,
		label: 'Chat',
		tagline: 'Real Conversations',
		bg: 'bg-orange-50/70',
		txt: 'text-orange-600/70',
	},
	{
		icon: <RiFireLine />,
		label: 'Trends',
		tagline: 'Stay Updated',
		bg: 'bg-rose-50/70',
		txt: 'text-rose-600/70',
	},
	{
		icon: <RiGiftLine />,
		label: 'Gifts',
		tagline: 'Spread Joy',
		bg: 'bg-amber-50/70',
		txt: 'text-amber-600/70',
	},
	{
		icon: <RiUser3Line />,
		label: 'Groups',
		tagline: 'Connect Together',
		bg: 'bg-emerald-50/70',
		txt: 'text-emerald-600/70',
	},
	{
		icon: <HiOutlineEmojiHappy />,
		label: 'Fun',
		tagline: 'Pure Vibes',
		bg: 'bg-indigo-50/70',
		txt: 'text-indigo-600/70',
	},
];

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
      case 'AUTHENTICATED': router.push('/desk'); break;
      case 'NOT_ONBOARDED':
      case 'NEW_USER': router.push('/onboard'); break;
      default: router.push('/fireup'); break;
    }
  }, 5000); 
      return () => clearTimeout(timer);
}, [authState, isLoading, router, redirecting]);

	const handleWelcome = () => {
		toast.success('Welcome to Firechat!');
		setShowConfetti(true);
		setTimeout(() => setShowConfetti(false), 5000);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-white text-neutral-900 p-6">
			{showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}

			<FireHeader />

			<div className="flex flex-col items-center gap-3 animate-fade-in-up">
				<Image src="/Firechat.svg" alt="Firechat" width={120} height={120} className="mb-1" />
				<h1 className="text-3xl font-semibold text-neutral-900 text-center font-comic">
					Firechat — small circles, clear talk
				</h1>
				<p className="max-w-xl text-center text-neutral-700/70 text-base">
					Private rooms, neat threads, and playful reactions — made simple for classmates.
				</p>
			</div>

			<div className="mt-8 flex flex-wrap gap-4 justify-center max-w-4xl">
				{FEATURES.map((f) => (
					<MinimalIcon
						key={f.label}
						icon={f.icon}
						label={f.label}
						tagline={f.tagline}
						bgClass={f.bg}
						txtClass={f.txt}
					/>
				))}
			</div>

			<button
				onClick={handleWelcome}
				className="
					mt-8 inline-flex items-center gap-3 px-6 py-2 rounded-full
					bg-orange-500/90 text-white font-medium text-sm
					hover:bg-orange-500/80 hover:scale-105
					focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2
					transition-all duration-200 ease-in-out shadow-md
				"
				aria-label="Grab your desk"
			>
				<PiRocketBold className="w-5 h-5" />
				Grab your desk now
			</button>

			<div className="mt-10 text-center max-w-lg">
				<h3 className="text-xl font-medium text-neutral-900 mb-2 font-comic">
					Join the community now!
				</h3>
				<p className="text-neutral-700/50">
					Focused rooms, zero clutter, and small features that make conversations feel human.
				</p>
			</div>
		</div>
	);
}
