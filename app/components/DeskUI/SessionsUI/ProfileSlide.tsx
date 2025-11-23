'use client';

import React, { useMemo } from 'react';
import { BiTime } from 'react-icons/bi';
import { IoFlameOutline } from 'react-icons/io5';
import {
	RiCoinsLine,
	RiFlashlightLine,
	RiInformationLine,
	RiLightbulbFlashLine,
	RiPriceTag3Line,
	RiSparklingLine,
	RiStarLine,
	RiUserSmileLine,
} from 'react-icons/ri';

import {
	extractMetadata,
	getTagColor,
	isRecentlyActive,
	relativeTimeFromMs,
} from '@/app/components/DeskUI/util';
import { FireAvatar, FireSlide } from '@/app/components/UI';
import type { CachedUser } from '@/app/lib/types';
import { formatTime, toMillis } from '@/app/lib/utils/time';

interface UserProfileSlideProps {
	user: CachedUser | null;
	isOpen: boolean;
	onClose: () => void;
}

export default function ProfileSlide({ user, isOpen, onClose }: UserProfileSlideProps) {
	const metadata = useMemo(() => (user ? extractMetadata(user.meta) : {}), [user]);
	if (!user) return null;

	const lastSeenMs = user.lastSeen ? toMillis(user.lastSeen) : 0;
	const online = isRecentlyActive(user.lastSeen);
	const lastSeenLabel = lastSeenMs ? relativeTimeFromMs(lastSeenMs) : 'unknown';

	return (
		<FireSlide
			open={isOpen}
			onClose={onClose}
			backdropStatic={false}
			size="md"
			header={`@${user.usernamey}`}
		>
			<div className="h-full overflow-y-auto px-5 animate-slide-up">
				{/* Header Section */}
				<div className="flex items-start gap-6 pt-5 pb-6">
					{/* Avatar */}
					<div className="relative flex-shrink-0">
						<FireAvatar
							seed={user.uid}
							src={user.avatarUrl}
							size={88}
							className="ring-1 ring-neutral-200/30 dark:ring-neutral-700/40"
						/>
						<div
							className={`absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full border-[3px] border-white dark:border-neutral-900 flex items-center justify-center ${
								online ? 'bg-lime-500' : 'bg-neutral-700/50'
							}`}
						>
							{online ? (
								<IoFlameOutline className="w-3.5 h-3.5 text-white" />
							) : (
								<span className="w-2 h-2 rounded-full bg-white/60" />
							)}
						</div>
						{online && (
							<RiSparklingLine className="absolute -top-1 -right-1 w-4 h-4 text-lime-400/80" />
						)}
					</div>

					{/* Info */}
					<div className="flex-1 min-w-0 pt-1">
						<div className="flex items-center gap-2 mb-1">
							<h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
								{user.displayName}
							</h1>
							<RiStarLine className="w-4 h-4 text-yellow-400 dark:text-yellow-300" />
						</div>
						<p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium mb-3">
							@{user.usernamey}
						</p>

						{/* Last seen + Kudos */}
						<div className="flex gap-4 items-center">
							<div className="flex items-center gap-2 text-sm text-lime-500 dark:text-lime-400">
								<span
									className={`w-2 h-2 rounded-full ${
										online ? 'bg-lime-500' : 'bg-neutral-600 dark:bg-neutral-500/50'
									}`}
								/>
								<span className="font-medium">{online ? 'Online now' : lastSeenLabel}</span>
							</div>
							<div className="flex items-center gap-2 text-sm font-semibold text-yellow-700 dark:text-yellow-300">
								<RiCoinsLine className="w-4 h-4" />
								<span>{user.kudos}</span>
								<span className="text-xs font-medium text-yellow-600 dark:text-yellow-200">
									kudos
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="space-y-6">
					{(metadata.mood || metadata.status) && (
						<div className="grid grid-cols-2 gap-3">
							{metadata.mood && (
								<div className="p-3 rounded-lg bg-indigo-50/20 dark:bg-indigo-800/40">
									<div className="flex items-center gap-2 mb-1.5">
										<RiUserSmileLine className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
										<span className="text-[12px] font-bold uppercase text-indigo-600 dark:text-indigo-300">
											Mood
										</span>
									</div>
									<p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
										{metadata.mood}
									</p>
								</div>
							)}
							{metadata.status && (
								<div className="p-3 rounded-lg bg-blue-50/20 dark:bg-blue-800/40">
									<div className="flex items-center gap-2 mb-1.5">
										<RiFlashlightLine className="w-4 h-4 text-blue-600 dark:text-blue-300" />
										<span className="text-[12px] font-bold uppercase text-blue-600 dark:text-blue-300">
											Status
										</span>
									</div>
									<p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
										{metadata.status}
									</p>
								</div>
							)}
						</div>
					)}

					{metadata.about && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<RiInformationLine className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
								<h3 className="text-[12px] font-bold uppercase text-blue-500 dark:text-blue-300">
									About
								</h3>
							</div>
							<p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 p-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50">
								{metadata.about}
							</p>
						</div>
					)}

					{metadata.tags && metadata.tags.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<RiPriceTag3Line className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
								<h3 className="text-[12px] font-bold uppercase text-rose-500 dark:text-rose-400">
									Tags
								</h3>
							</div>
							<div className="flex flex-wrap gap-2">
								{metadata.tags.map((tag, idx) => (
									<span
										key={idx}
										className={`px-3 py-1.5 rounded-xl text-xs font-semibold ring-2 ${getTagColor(idx)} dark:ring-neutral-600/40`}
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					)}

					{metadata.quirks && metadata.quirks.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2 text-violet-400">
								<RiLightbulbFlashLine className="w-3.5 h-3.5" />
								<h3 className="text-[12px] font-bold uppercase text-neutral-600 dark:text-neutral-400">
									Quirks
								</h3>
							</div>
							<div className="space-y-2">
								{metadata.quirks.map((quirk, idx) => (
									<div
										key={idx}
										className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50"
									>
										<div className="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
											<span className="text-[12px] text-neutral-600 dark:text-neutral-300">
												✦
											</span>
										</div>
										<span className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1">
											{quirk}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{user.createdAt && (
						<div className="pt-2 border-t border-neutral-200/30 dark:border-neutral-700/40">
							<div className="flex items-center gap-2 p-2">
								<BiTime className="w-4 h-4 text-lime-600 dark:text-lime-400" />
								<div className="flex flex-col">
									<span className="text-[12px] text-neutral-500 dark:text-neutral-400 font-medium">
										Member since
									</span>
									<span className="text-sm font-semibold text-lime-700 dark:text-lime-500">
										{formatTime(user.createdAt, 'en-US', {
											weekday: 'short',
											month: 'short',
											day: 'numeric',
											year: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
											hour12: true,
										})}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</FireSlide>
	);
}
