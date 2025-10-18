'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import {
	FaBolt,
	FaComments,
	FaFire,
	FaGift,
	FaHeart,
	FaLaugh,
	FaRocket,
	FaSmile,
	FaStar,
	FaUsers,
} from 'react-icons/fa';

import FireHeader from '@/app/components/UI/FireHeader';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';

export default function Home() {
	const [showConfetti, setShowConfetti] = useState(false);
	const { authState, isLoading } = useAuthState();
	const router = useRouter();
	const [redirecting, setRedirecting] = useState(false);

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
					router.push('/onboard');
					break;
				default:
					router.push('/fireup');
					break;
			}
		}, 2000);

		return () => clearTimeout(timer);
	}, [authState, isLoading, router, redirecting]);

	const handleWelcome = () => {
		toast.success('Welcome to the Firechat community!');
		setShowConfetti(true);
		setTimeout(() => setShowConfetti(false), 6000);
	};

	const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
	useEffect(() => {
		setWindowSize({ width: window.innerWidth, height: window.innerHeight });
		const handleResize = () =>
			setWindowSize({ width: window.innerWidth, height: window.innerHeight });
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800 p-6 relative">
			{showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}

			<FireHeader />
			<Image src="/Firechat.svg" alt="Firechat Logo" width={150} height={150} className="mb-4" />
			<h2 className="text-3xl font-dyna mb-4">Connect, Chat, and Chill</h2>
			<p className="text-lg font-righteous mb-8 text-center max-w-xl text-neutral-800">
				Connect with your classmates in a fun, secure, and private way.
			</p>
			<p className="text-lg font-righteous mb-8 text-center max-w-xl text-neutral-600">
				No more messy WhatsApp groups—just pure chat vibes!
			</p>

			<div className="flex flex-wrap justify-center gap-4 mb-8">
				<FaRocket className="text-blue-400 w-10 h-10" />
				<FaHeart className="text-pink-400 w-10 h-10" />
				<FaFire className="text-red-400 w-10 h-10" />
				<FaGift className="text-lime-400 w-10 h-10" />
				<FaSmile className="text-yellow-400 w-10 h-10" />
				<FaBolt className="text-indigo-400 w-10 h-10" />
				<FaComments className="text-purple-400 w-10 h-10" />
				<FaLaugh className="text-orange-400 w-10 h-10" />
				<FaUsers className="text-lime-400 w-10 h-10" />
				<FaStar className="text-yellow-400 w-10 h-10" />
			</div>

			<button
				className="decoration-dotted bg-indigo-600 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition"
				onClick={handleWelcome}
			>
				Grab your desk now!
			</button>

			<div className="mt-12 text-center">
				<h3 className="text-2xl font-dyna mb-4">Want More Fun?</h3>
				<p className="text-lg font-righteous text-neutral-700 mb-6">
					Join the Firechat community and explore goofy, funky, and amazing vibes with your
					friends!
				</p>
			</div>
		</div>
	);
}
