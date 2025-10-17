'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	IoTrophyOutline,
	IoFlameOutline,
	IoDiamondOutline,
	IoHappyOutline,
	IoInformationCircleOutline,
	IoSparklesOutline,
	IoPricetagsOutline,
	IoStarOutline,
} from 'react-icons/io5';

import FireAvatar from '@/app/components/UI/FireAvatar';
import FireSlide from '@/app/components/UI/FireSlide';
import type { FireCachedUser } from '@/app/lib/types';
import { FireTime, formatTime, toMillis, validate } from '@/app/lib/utils/time';

interface UserMetadata {
	mood?: string;
	status?: string;
	about?: string;
	tags?: string[];
	quirks?: string[];
}

function extractMetadata(meta?: Record<string, unknown>): UserMetadata {
	if (!meta) return {};
	return {
		mood: typeof meta.mood === 'string' ? meta.mood : undefined,
		status: typeof meta.status === 'string' ? meta.status : undefined,
		about: typeof meta.about === 'string' ? meta.about : undefined,
		tags: Array.isArray(meta.tags) ? meta.tags.filter((t) => typeof t === 'string') : undefined,
		quirks: Array.isArray(meta.quirks)
			? meta.quirks.filter((q) => typeof q === 'string')
			: undefined,
	};
}

export function isRecentlyActive(lastSeen?: FireTime): boolean {
	if (!validate.isValid(lastSeen)) return false;
	const lastSeenMs = toMillis(lastSeen);
	const diff = Date.now() - lastSeenMs;
	return diff <= 5 * 60 * 1000 && diff >= 0;
}

function relativeTimeFromMs(ms: number): string {
	const s = Math.round((Date.now() - ms) / 1000);
	if (s < 10) return 'just now';
	if (s < 60) return `${s}s ago`;
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.round(h / 24);
	return `${d}d ago`;
}

const TAG_COLORS = [
	'bg-blue-50 text-blue-700 border-blue-200',
	'bg-indigo-50 text-indigo-700 border-indigo-200',
	'bg-pink-50 text-pink-700 border-pink-200',
	'bg-neutral-50 text-neutral-700 border-neutral-200',
	'bg-lime-50 text-lime-700 border-lime-200',
	'bg-rose-50 text-rose-700 border-rose-200',
	'bg-cyan-50 text-cyan-700 border-cyan-200',
	'bg-purple-50 text-purple-700 border-purple-200',
];

const getTagColor = (index: number): string => TAG_COLORS[index % TAG_COLORS.length];

interface UserProfileSlideProps {
	user: FireCachedUser | null;
	isOpen: boolean;
	onClose: () => void;
}

export default function ProfileSlide({ user, isOpen, onClose }: UserProfileSlideProps) {
	const metadata = useMemo(() => (user ? extractMetadata(user.meta) : {}), [user]);
	const [kudosPulse, setKudosPulse] = useState(false);
	const prevKudosRef = useRef<number | null>(null);

	useEffect(() => {
		if (!user) return;
		const prev = prevKudosRef.current;
		if (prev !== null && prev !== user.kudos) {
			setKudosPulse(true);
			const t = setTimeout(() => setKudosPulse(false), 420);
			return () => clearTimeout(t);
		}
		prevKudosRef.current = user.kudos;
	}, [user, user?.kudos]);

	if (!user) return null;

	const lastSeenMs = user.lastSeen ? toMillis(user.lastSeen) : 0;
	const online = isRecentlyActive(user.lastSeen);
	const lastSeenLabel = lastSeenMs ? relativeTimeFromMs(lastSeenMs) : 'unknown';

	return (
		<FireSlide open={isOpen} onClose={onClose} size="md" header="" backdropStatic={false}>
			<div className="flex flex-col gap-6 p-6">
				<div className="animate-slide-in flex items-start gap-4">
					<div className="relative flex-shrink-0">
						<FireAvatar
							seed={user.uid}
							src={user.avatarUrl}
							size={72}
							className="ring-2 ring-neutral-200 shadow-lg"
						/>
						<span
							aria-hidden
							className={`absolute -bottom-2 -right-2 w-5 h-5 rounded-full border-3 border-white flex items-center justify-center transition-all duration-300 ${
								online
									? 'bg-gradient-to-r from-lime-400 to-lime-500 shadow-lg shadow-lime-500/50 animate-pulse'
									: 'bg-neutral-300'
							}`}
							title={online ? 'Online' : `Last seen ${lastSeenLabel}`}
						>
							{online && <IoFlameOutline className="w-2 h-2 text-white animate-float" />}
						</span>
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<h2 className="text-xl font-bold text-neutral-900 truncate">
								{user.displayName}
							</h2>
							<IoStarOutline className="w-3.5 h-3.5 text-amber-400" />
						</div>
						<div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
							<span className="truncate font-medium">@{user.usernamey}</span>
							<span className="w-1 h-1 rounded-full bg-neutral-300" />
							<span aria-live="polite" className="font-medium">
								{online ? '🔥 online' : lastSeenLabel}
							</span>
						</div>

						<div
							className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 transition-all duration-300 ${
								kudosPulse ? 'scale-110 shadow-lg shadow-amber-200/50' : 'shadow-sm'
							}`}
							aria-live="polite"
						>
							<IoTrophyOutline className="w-3.5 h-3.5 text-yellow-500" />
							<span className="text-sm font-bold text-amber-900">{user.kudos}</span>
							<span className="text-xs font-medium text-amber-700">kudos</span>
						</div>
					</div>
				</div>

				{(metadata.mood || metadata.status) && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{metadata.mood && (
							<div className="animate-slide-in stagger-delay-1 group p-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-50/50 hover:border-indigo-200 transition-all duration-300 cursor-default">
								<div className="flex items-center gap-2 text-indigo-600 mb-2">
									<IoHappyOutline className="w-4 h-4" />
									<span className="text-xs font-semibold uppercase tracking-wide">
										Mood
									</span>
								</div>
								<p className="text-sm text-indigo-900 font-medium">{metadata.mood}</p>
							</div>
						)}

						{metadata.status && (
							<div className="animate-slide-in stagger-delay-2 group p-3 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/50 hover:border-blue-200 transition-all duration-300 cursor-default">
								<div className="flex items-center gap-2 text-blue-600 mb-2">
									<IoSparklesOutline className="w-4 h-4" />
									<span className="text-xs font-semibold uppercase tracking-wide">
										Status
									</span>
								</div>
								<p className="text-sm text-blue-900 font-medium">{metadata.status}</p>
							</div>
						)}
					</div>
				)}

				{metadata.about && (
					<div className="animate-slide-in stagger-delay-3">
						<div className="flex items-center gap-2 mb-2">
							<IoInformationCircleOutline className="w-3.5 h-3.5 text-neutral-400" />
							<h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
								About
							</h3>
						</div>
						<p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50/60 p-3 rounded-lg border border-neutral-100">
							{metadata.about}
						</p>
					</div>
				)}

				{metadata.tags && metadata.tags.length > 0 && (
					<div className="animate-slide-in stagger-delay-4">
						<div className="flex items-center gap-2 mb-2.5">
							<IoPricetagsOutline className="w-3.5 h-3.5 text-neutral-400" />
							<h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
								Tags
							</h3>
						</div>
						<div className="flex flex-wrap gap-2">
							{metadata.tags.map((tag, idx) => (
								<span
									key={idx}
									className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default ${getTagColor(
										idx
									)}`}
									style={{ animationDelay: `${idx * 50}ms` }}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				)}

				{metadata.quirks && metadata.quirks.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-2.5">
							<IoDiamondOutline className="w-3.5 h-3.5 text-neutral-400" />
							<h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
								Quirks
							</h3>
						</div>
						<div className="space-y-2">
							{metadata.quirks.map((quirk, idx) => (
								<div
									key={idx}
									className="animate-slide-in flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all duration-300 cursor-default"
									style={{ animationDelay: `${idx * 60}ms` }}
								>
									<span className="text-indigo-400 text-sm flex-shrink-0 mt-0.5">✦</span>
									<span className="text-xs text-indigo-800 flex-1 leading-relaxed">
										{quirk}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{user.createdAt && (
					<div className="pt-2 border-t border-neutral-100">
						<p className="text-xs text-neutral-500">
							<span className="font-semibold text-neutral-600">Joined</span>{' '}
							{formatTime(user.createdAt)}
						</p>
					</div>
				)}
			</div>
		</FireSlide>
	);
}
