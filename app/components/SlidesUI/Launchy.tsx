'use client';

import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import {
	FaFire,
	FaInfoCircle,
	FaLightbulb,
	FaQuoteLeft,
	FaRocket,
	FaSmile,
	FaStar,
	FaTags,
} from 'react-icons/fa';

import FireAvatar from '@/app/components/UI/FireAvatar';
import FireButton from '@/app/components/UI/FireButton';

type Preview = {
	displayName?: string;
	avatarUrl?: string | null;
	usernamey?: string;
	identifierKey?: string;
	mood?: string | null;
	quirks?: string[];
	tags?: string[];
	status?: string;
	about?: string;
};

type Props = {
	onLaunch: () => Promise<void> | void; // parent does the heavy lifting (userforge)
	loading?: boolean; // parent can control loading state (preferred)
	preview?: Preview; // optional small preview shown in UI
	onFinish?: () => void; // optional callback after successful launch
	step?: number;
	total?: number;
};

export default function Launchy({
	onLaunch,
	loading,
	preview,
	onFinish,
	step = 7,
	total = 7,
}: Props) {
	const [showConfetti, setShowConfetti] = useState(true);
	const [localLoading, setLocalLoading] = useState(false);

	const isLoading = typeof loading === 'boolean' ? loading : localLoading;

	useEffect(() => {
		// show confetti briefly on mount (celebration before user hits launch)
		const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
		return () => clearTimeout(confettiTimer);
	}, []);

	// When pressed, call parent onLaunch.
	// If parent provides loading boolean, they manage it; otherwise we use localLoading.
	const handleClick = async () => {
		try {
			if (typeof loading !== 'boolean') setLocalLoading(true);
			await onLaunch();
			// call optional UI finalizer after a successful launch
			try {
				onFinish?.();
			} catch {}
		} catch {
		} finally {
			if (typeof loading !== 'boolean') setLocalLoading(false);
		}
	};

	return (
		<div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 via-orange-50 to-red-50 p-4">
			{showConfetti && <Confetti recycle={false} numberOfPieces={400} gravity={0.08} />}

			{/* Floating icons */}
			<div className="absolute inset-0 pointer-events-none">
				{[...Array(12)].map((_, i) => (
					<FaStar
						key={i}
						className="absolute text-yellow-400/70 animate-float"
						style={{
							width: `${10 + (i % 3)}px`,
							height: `${10 + (i % 3)}px`,
							top: `${(i * 73) % 100}%`,
							left: `${(i * 47) % 100}%`,
							animationDelay: `${(i * 0.2) % 2}s`,
							animationDuration: `${3 + (i % 4)}s`,
						}}
					/>
				))}
				<FaFire className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-orange-400 w-16 h-16 animate-pulse opacity-80" />
				<FaSmile className="absolute top-1/4 right-1/4 text-yellow-500 w-12 h-12 animate-float-slow opacity-70" />
			</div>

			{/* Main Content */}
			<div className="relative z-10 max-w-4xl w-full mx-auto px-6 text-center">
				<h1 className="font-dyna text-6xl lg:text-8xl text-red-500 mb-4 flex items-center justify-center gap-4 animate-fadeIn drop-shadow-lg">
					<FaRocket className="animate-float w-16 h-16" />
					Launch!
				</h1>

				<p className="font-righteous text-xl text-neutral-700 mb-8 animate-fadeIn">
					Your profile is ready for takeoff. Fire up the chat!
				</p>

				{/* Enhanced Preview Card */}
				{preview && (
					<div className="mb-8 text-left mx-auto max-w-lg bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-200/50 animate-fadeInUp">
						<div className="flex items-start gap-5">
							{/* Render FireAvatar with URL */}
							<FireAvatar
								seed={preview.displayName || 'Firechat'}
								src={preview?.avatarUrl ?? undefined}
								size={64}
								className="shadow-sm"
							/>
							<div className="flex-1">
								<h2 className="text-2xl font-bold text-neutral-800">
									{preview?.displayName ?? 'firechat_user'}
								</h2>
								<p className="text-md text-orange-600 font-mono">
									@{preview.usernamey || 'new_user'}
								</p>
							</div>
						</div>

						<div className="mt-6 space-y-4">
							{preview.mood && (
								<div className="flex items-center gap-3 text-neutral-700">
									<FaSmile className="w-5 h-5 text-yellow-500" />
									<span className="font-medium">Feeling {preview.mood}</span>
								</div>
							)}

							{preview.about && (
								<div className="flex items-start gap-3 text-neutral-700">
									<FaQuoteLeft className="w-4 h-4 text-neutral-400 mt-1 flex-shrink-0" />
									<p className="italic">{preview.about}</p>
								</div>
							)}

							{preview.quirks && preview.quirks.length > 0 && (
								<div className="flex items-start gap-3">
									<FaLightbulb className="w-5 h-5 text-blue-500 mt-1" />
									<div className="flex flex-wrap gap-2">
										{preview.quirks.map((q) => (
											<span
												key={q}
												className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
											>
												{q}
											</span>
										))}
									</div>
								</div>
							)}

							{preview.tags && preview.tags.length > 0 && (
								<div className="flex items-start gap-3">
									<FaTags className="w-5 h-5 text-lime-500 mt-1" />
									<div className="flex flex-wrap gap-2">
										{preview.tags.map((t) => (
											<span
												key={t}
												className="px-3 py-1 text-sm bg-lime-100 text-lime-800 rounded-full"
											>
												{t}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="mt-6 text-xs text-neutral-500 flex items-center gap-2 justify-center bg-neutral-100/70 p-2 rounded-md">
							<FaInfoCircle />
							<span>This is a preview of your public profile.</span>
						</div>
					</div>
				)}

				<FireButton
					onClick={handleClick}
					disabled={isLoading}
					loading={isLoading}
					className={`px-10 py-4 text-lg flex items-center justify-center gap-3 ${
						isLoading ? 'opacity-60 cursor-wait' : 'hover:scale-105'
					} bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-full shadow-xl transition-all duration-300 transform-gpu`}
				>
					{isLoading ? 'Launching...' : 'Take me to my Desk!'}
				</FireButton>

				{/* Step indicator */}
				<div className="flex items-center justify-center gap-3 mt-8">
					<div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
					<span className="text-sm text-neutral-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
