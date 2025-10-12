'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	FaClock,
	FaCoins,
	FaFire,
	FaGem,
	FaGhost,
	FaInfoCircle,
	FaMagic,
	FaStar,
	FaTags,
} from 'react-icons/fa';

import FireAvatar from '@/app/components/UI/FireAvatar';
import FireSlide from '@/app/components/UI/FireSlide';
import type { FireCachedUser } from '@/app/lib/types';
import { FireTime, formatTime, toMillis, validate } from '@/app/lib/utils/time';

/* ==================== Types & Helpers ==================== */

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

/* ==================== Tag Colors ==================== */

const TAG_COLORS = [
	'bg-blue-50 text-blue-700 border-blue-200',
	'bg-violet-50 text-violet-700 border-violet-200',
	'bg-pink-50 text-pink-700 border-pink-200',
	'bg-neutral-50 text-neutral-700 border-neutral-200',
	'bg-lime-50 text-lime-700 border-lime-200',
	'bg-rose-50 text-rose-700 border-rose-200',
	'bg-cyan-50 text-cyan-700 border-cyan-200',
	'bg-purple-50 text-purple-700 border-purple-200',
];

const getTagColor = (index: number): string => TAG_COLORS[index % TAG_COLORS.length];

/* ==================== Profile Slide ==================== */

interface UserProfileSlideProps {
	user: FireCachedUser | null;
	isOpen: boolean;
	onClose: () => void;
}

export default function ProfileSlide({ user, isOpen, onClose }: UserProfileSlideProps) {
	const metadata = useMemo(() => (user ? extractMetadata(user.meta) : {}), [user]);
	const [kudosPulse, setKudosPulse] = useState(false);
	const prevKudosRef = useRef<number | null>(null);

	// animate kudos when it changes
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
			<div className="flex flex-col gap-4 p-4">
				{/* Header: avatar + name */}
				<div className="flex items-center gap-4">
					<div className="relative">
						<FireAvatar
							seed={user.uid}
							src={user.avatarUrl}
							size={72}
							className="ring-1 ring-neutral-100"
						/>
						{/* subtle presence */}
						<span
							aria-hidden
							className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
								online ? 'bg-lime-500 animate-ping-slow' : 'bg-neutral-300'
							}`}
							title={online ? 'Online' : `Last seen ${lastSeenLabel}`}
						>
							{online ? (
								<FaFire className="w-2 h-2 text-white" />
							) : (
								<span className="w-2 h-2 rounded-full" />
							)}
						</span>
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h2 className="text-lg font-semibold text-neutral-900 truncate">
								{user.displayName}
							</h2>
							<FaStar className="w-3 h-3 text-neutral-400" />
						</div>
						<div className="flex items-center gap-3 text-xs text-neutral-500">
							<span className="truncate">@{user.usernamey}</span>
							<span aria-live="polite">• {online ? 'online' : lastSeenLabel}</span>
						</div>
					</div>

					{/* subtle kudos card */}
					<div
						className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border border-neutral-200 bg-white min-[72px] ${
							kudosPulse
								? 'scale-105 transform transition-transform duration-200'
								: 'transform transition-transform duration-200'
						}`}
						aria-live="polite"
					>
						<FaCoins className="w-4 h-4 text-yellow-500" />
						<span className="text-sm font-semibold text-neutral-900">{user.kudos}</span>
						<span className="text-xs text-neutral-400">kudos</span>
					</div>
				</div>

				{/* mood + status: subtle cards, side-by-side on md */}
				{(metadata.mood || metadata.status) && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{metadata.mood && (
							<div className="flex flex-col items-start gap-2 p-3 rounded-xl border border-neutral-100 bg-neutral-50/40">
								<div className="flex items-center gap-2 text-neutral-700">
									<FaGhost className="w-4 h-4" />
									<span className="text-xs font-semibold uppercase tracking-wide">
										Mood
									</span>
								</div>
								<p className="text-sm text-neutral-900 font-medium truncate">
									{metadata.mood}
								</p>
							</div>
						)}

						{metadata.status && (
							<div className="flex flex-col items-start gap-2 p-3 rounded-xl border border-blue-100 bg-blue-50/40">
								<div className="flex items-center gap-2 text-blue-700">
									<FaMagic className="w-4 h-4" />
									<span className="text-xs font-semibold uppercase tracking-wide">
										Status
									</span>
								</div>
								<p className="text-sm text-blue-900 font-medium  truncate">
									{metadata.status}
								</p>
							</div>
						)}
					</div>
				)}

				{/* About */}
				{metadata.about && (
					<div>
						<div className="flex items-center gap-1.5 mb-1">
							<FaInfoCircle className="w-3 h-3 text-neutral-400" />
							<h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
								About
							</h3>
						</div>
						<p className="text-xs text-neutral-600 leading-relaxed">{metadata.about}</p>
					</div>
				)}

				{/* Tags */}
				{metadata.tags && metadata.tags.length > 0 && (
					<div>
						<div className="flex items-center gap-1.5 mb-1">
							<FaTags className="w-3 h-3 text-neutral-400" />
							<h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
								Tags
							</h3>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{metadata.tags.map((tag, idx) => (
								<span
									key={idx}
									className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium border ${getTagColor(
										idx
									)}`}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Quirks */}
				{metadata.quirks && metadata.quirks.length > 0 && (
					<div>
						<div className="flex items-center gap-1.5 mb-1">
							<FaGem className="w-3 h-3 text-neutral-400" />
							<h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
								Quirks
							</h3>
						</div>
						<div className="space-y-1.5">
							{metadata.quirks.map((quirk, idx) => (
								<div
									key={idx}
									className="flex items-start gap-2 p-2 bg-violet-50/60 rounded-lg border border-violet-100"
								>
									<span className="text-violet-400 text-xs mt-0.5">✦</span>
									<span className="text-xs text-violet-800 flex-1">{quirk}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Stats */}
				<div className="pt-2">
					<div className="grid grid-cols-2 gap-2">
						<div className="bg-neutral-50 rounded-lg p-2 text-center border border-neutral-200">
							<FaCoins className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
							<p className="text-xl font-bold text-neutral-900">{user.kudos}</p>
							<p className="text-sm text-neutral-500 font-medium mt-0.5">Kudos</p>
						</div>
						<div className="bg-neutral-50 rounded-lg p-2 text-center border border-neutral-200">
							<FaClock className="w-4 h-4 text-lime-500 mx-auto mb-1" />
							<p className="text-xs font-semibold text-neutral-700 mt-0.5">
								{user.createdAt ? formatTime(user.createdAt) : 'Unknown'}
							</p>
							<p className="text-sm text-neutral-500 font-medium mt-0.5">Joined</p>
						</div>
					</div>
				</div>
			</div>
		</FireSlide>
	);
}
