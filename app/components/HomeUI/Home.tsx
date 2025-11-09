'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { PiRocketBold } from 'react-icons/pi';

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
          router.push('/onboard');
          break;
        default:
          router.push('/fireup');
          break;
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-neutral-900 p-5">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}

      <FireHeader />

      <div className="flex flex-col items-center justify-center gap-4 animate-fade-in-up mt-10">
        <Image src="/Firechat.svg" alt="Firechat" width={120} height={120} className="mb-1" />
        <h1 className="text-3xl font-semibold text-center font-bubblegum">
          Firechat — small circles, clear talk
        </h1>
        <p className="font-comic max-w-xl text-center text-neutral-500 text-base">
          Private rooms, neat threads, and playful reactions — made simple.
        </p>
      </div>

      <button
        onClick={handleWelcome}
        className="
          gradient-ring-wrapper
        "
        aria-label="Grab your desk"
      >
        <span className="flex items-center gap-3 bg-white px-7 py-2 rounded-full">
          <PiRocketBold className="w-5 h-5" />
          Grab your desk now
        </span>
        </button>

        <div className="mt-12 text-center max-w-lg">
				<h3 className="text-xl font-medium text-neutral-900 mb-2 font-bubblegum">
					Join the community now!
				</h3>
				<p className="text-neutral-500 font-comic">
					Focused rooms, zero clutter that make conversations feel human.
				</p>
			</div>
        
      <footer className="bottom-0 absolute flex-row flex items-center justify-center w-full p-4">
				<span className="text-neutral-500 text-3xl font-jolly">
					Made with ❤️ Thanks for being here.
				</span>
			</footer>
    </div>
  );
}
