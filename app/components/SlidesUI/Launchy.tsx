'use client';

import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import {
	RiEmotionHappyLine,
	RiInformationLine,
	RiLightbulbLine,
	RiLockLine,
	RiPriceTag3Line,
	RiSparklingLine,
	RiStarLine,
} from 'react-icons/ri';
import { TbRocket } from 'react-icons/tb';

import { FireAvatar, FireButton } from '@/app/components/UI';

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

type LaunchyProps = {
	onLaunch: () => Promise<void> | void;
	loading?: boolean;
	preview?: Preview;
	onFinish?: () => void;
	step?: number;
	total?: number;
};

export function Launchy({
	onLaunch,
	loading,
	preview,
	onFinish,
	step = 7,
	total = 7,
}: LaunchyProps) {
	const [showConfetti, setShowConfetti] = useState(true);
	const [localLoading, setLocalLoading] = useState(false);
	const [showIdentifier, setShowIdentifier] = useState(false);

	const isLoading = typeof loading === 'boolean' ? loading : localLoading;

	useEffect(() => {
		const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
		return () => clearTimeout(confettiTimer);
	}, []);

	const handleClick = async () => {
		try {
			if (typeof loading !== 'boolean') setLocalLoading(true);
			await onLaunch();
			try {
				onFinish?.();
			} catch {}
		} catch {
		} finally {
			if (typeof loading !== 'boolean') setLocalLoading(false);
		}
	};

	return (
		<div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-900">
			{showConfetti && <Confetti recycle={false} numberOfPieces={300} gravity={0.08} />}

			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				{[...Array(10)].map((_, i) => (
					<RiStarLine
						key={i}
						className="absolute text-amber-400/40 dark:text-amber-400/20 animate-float-elegant"
						style={{
							width: `${12 + (i % 3) * 2}px`,
							height: `${12 + (i % 3) * 2}px`,
							top: `${(i * 73) % 100}%`,
							left: `${(i * 47) % 100}%`,
							animationDelay: `${(i * 0.2) % 2}s`,
							animationDuration: `${3 + (i % 4)}s`,
						}}
					/>
				))}
			</div>

			<div className="mt-1 relative z-10 max-w-4xl w-full mx-auto px-6 text-center animate-fade-in-up">
				<h1 className="font-bubblegum text-5xl lg:text-4xl text-rose-500 dark:text-rose-400 mb-5 flex items-center justify-center gap-4 drop-shadow-sm">
					<TbRocket className="animate-float-elegant w-16 h-16" />
					Launch!
				</h1>

				<p
					className="font-righteous text-lg text-zinc-700 dark:text-neutral-300 mb-10"
					style={{ animationDelay: '0.1s' }}
				>
					Your profile is ready for takeoff. Fire up the chat!
				</p>

				{preview && (
					<div
						className="mb-10 text-left mx-auto max-w-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm p-7 rounded-2xl border border-zinc-200/80 dark:border-neutral-700/40 "
						style={{ animationDelay: '0.2s' }}
					>
						<div className="flex items-start gap-5">
							<FireAvatar
								seed={preview.displayName || 'Firechat'}
								src={preview?.avatarUrl ?? undefined}
								size={64}
							/>
							<div className="flex-1">
								<h2 className="text-2xl font-bold text-zinc-900 dark:text-neutral-100">
									{preview?.displayName ?? 'firechat_user'}
								</h2>
								<p className="text-base text-orange-600 dark:text-orange-400 font-mono">
									@{preview.usernamey || 'new_user'}
								</p>
							</div>
						</div>

						<div className="mt-7 space-y-4">
							{preview.mood && (
								<div className="flex items-center gap-3 text-zinc-700 dark:text-neutral-300">
									<RiEmotionHappyLine className="w-5 h-5 text-amber-500 dark:text-amber-400" />
									<span className="font-medium">Feeling {preview.mood}</span>
								</div>
							)}

							{preview.about && (
								<div className="flex items-start gap-3 text-zinc-700 dark:text-neutral-300">
									<RiSparklingLine className="w-4 h-4 text-zinc-400 dark:text-neutral-500 mt-1 flex-shrink-0" />
									<p>&quot;{preview.about}&ldquo;</p>
								</div>
							)}

							{preview.quirks && preview.quirks.length > 0 && (
								<div className="flex items-start gap-3">
									<RiLightbulbLine className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-1" />
									<div className="flex flex-wrap gap-2">
										{preview.quirks.map((q) => (
											<span
												key={q}
												className="px-3 py-1.5 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-medium"
											>
												{q}
											</span>
										))}
									</div>
								</div>
							)}

							{preview.tags && preview.tags.length > 0 && (
								<div className="flex items-start gap-3">
									<RiPriceTag3Line className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mt-1" />
									<div className="flex flex-wrap gap-2">
										{preview.tags.map((t) => (
											<span
												key={t}
												className="px-3 py-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium"
											>
												{t}
											</span>
										))}
									</div>
								</div>
							)}
						</div>

						<div className="mt-8 space-y-3 overflow-hidden">
							<div className="text-xs text-zinc-500 dark:text-neutral-400 flex items-center gap-2 justify-center bg-zinc-50/70 dark:bg-neutral-800/50 p-2 rounded-lg">
								<RiInformationLine className="w-4 h-4" />
								<span>This is a preview of your public profile.</span>
							</div>

							<div className="flex items-start gap-2">
								<div className="flex-1">
									<div className="flex items-center justify-between gap-2">
										<div className="text-sm text-zinc-700 dark:text-neutral-300 font-medium flex gap-1">
											Identifier
											<RiLockLine className="w-4 h-4 text-purple-400 dark:text-purple-500 animate-pulse-soft" />
										</div>

										<button
											type="button"
											onClick={() => setShowIdentifier((s) => !s)}
											aria-pressed={showIdentifier}
											className="px-2 py-0.5 rounded-md text-xs font-semibold bg-white dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700/40 hover:bg-zinc-100 dark:hover:bg-neutral-700 transition dark:text-neutral-200"
										>
											{showIdentifier ? 'Hide' : 'Reveal'}
										</button>
									</div>

									<div className="relative mt-2 max-w-xs">
										<div className="rounded-md bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700/40 px-2 py-1">
											<span className="font-mono text-xs text-zinc-500 dark:text-neutral-400">
												{preview?.identifierKey ? '••••••••••' : 'No identifier set'}
											</span>
										</div>

										<div
											aria-hidden={!showIdentifier}
											className={`absolute inset-0 rounded-md px-2 py-1 bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-700/40 transition-transform duration-300 ease-out overflow-hidden ${
												showIdentifier
													? 'translate-x-0 opacity-100'
													: '-translate-x-full opacity-0'
											}`}
										>
											<span className="font-mono text-xs text-zinc-800 dark:text-neutral-200 select-all">
												{preview?.identifierKey ?? '—'}
											</span>
										</div>
									</div>
								</div>
							</div>

							<div className="text-xs text-zinc-400 dark:text-neutral-500 flex items-center gap-2 justify-center bg-transparent p-0 rounded-lg">
								<span>Cannot show identifier due to privacy reasons.</span>
							</div>
						</div>
					</div>
				)}

				<div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
					<FireButton
						onClick={handleClick}
						disabled={isLoading}
						loading={isLoading}
						className={`px-10 py-4 text-lg flex items-center justify-center gap-3 ${
							isLoading ? 'opacity-60 cursor-wait' : 'hover:scale-105 hover:-translate-y-0.5'
						} bg-gradient-to-r from-rose-500 to-orange-500 dark:from-rose-600 dark:to-orange-600 text-white font-bold rounded-full transition-all duration-300 transform-gpu`}
					>
						{isLoading ? 'Launching...' : 'Take me to my Desk!'}
					</FireButton>
				</div>

				<div
					className="flex items-center justify-center gap-3 mt-10 "
					style={{ animationDelay: '0.4s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse-soft" />
					<span className="text-sm text-zinc-500 dark:text-neutral-400 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
