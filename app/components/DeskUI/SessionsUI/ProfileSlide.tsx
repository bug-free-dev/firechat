import React, { useMemo } from 'react';
import { BiTime } from 'react-icons/bi';
import { IoFlameOutline } from 'react-icons/io5';
import {
	RiCoinsLine,
	RiFlashlightLine,
	RiLightbulbFlashLine,
	RiPriceTag3Line,
	RiQuoteText,
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
import type { FireCachedUser } from '@/app/lib/types';
import { formatTime, toMillis } from '@/app/lib/utils/time';

interface UserProfileSlideProps {
	user: FireCachedUser | null;
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
		<FireSlide open={isOpen} onClose={onClose} size="md" header="" backdropStatic={false}>
			<div className="h-full overflow-y-auto px-6 pt-8 pb-6 animate-slide-up">
				{/* Header Section */}
				<div className="flex items-start gap-6 mb-8">
					{/* Avatar */}
					<div className="relative flex-shrink-0">
						<FireAvatar
							seed={user.uid}
							src={user.avatarUrl}
							size={88}
							className="ring-1 ring-neutral-200/50"
						/>
						<div
							className={`absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full border-[3px] border-white flex items-center justify-center ${
								online ? 'bg-lime-600' : 'bg-neutral-300'
							}`}
						>
							{online ? (
								<IoFlameOutline className="w-3.5 h-3.5 text-white" />
							) : (
								<span className="w-2 h-2 rounded-full bg-white/60" />
							)}
						</div>
						{online && (
							<RiSparklingLine className="absolute -top-1 -right-1 w-4 h-4 text-lime-400" />
						)}
					</div>

					{/* Info */}
					<div className="flex-1 min-w-0 pt-1">
						<div className="flex items-center gap-2 mb-1">
							<h1 className="text-2xl font-semibold text-neutral-900 tracking-tight truncate">
								{user.displayName}
							</h1>
							<RiStarLine className="w-4 h-4 text-yellow-500" />
						</div>
						<p className="text-sm text-neutral-600 font-medium mb-3">@{user.usernamey}</p>

						{/* Last seen + Kudos side by side */}
						<div className="flex gap-4 items-center">
							<div className="flex items-center gap-2 text-sm text-lime-700">
								<span
									className={`w-2 h-2 rounded-full ${online ? 'bg-lime-600' : 'bg-neutral-300'}`}
								/>
								<span className="font-medium">{online ? 'Online now' : lastSeenLabel}</span>
							</div>
							<div className="flex items-center gap-2 text-sm font-semibold text-yellow-800">
								<RiCoinsLine className="w-4 h-4" />
								<span>{user.kudos}</span>
								<span className="text-xs font-medium text-yellow-700">kudos</span>
							</div>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="space-y-6">
					{(metadata.mood || metadata.status) && (
						<div className="grid grid-cols-2 gap-3">
							{metadata.mood && (
								<div className="p-3 rounded-lg bg-indigo-50/40">
									<div className="flex items-center gap-2 mb-1.5">
										<RiUserSmileLine className="w-4 h-4 text-indigo-600" />
										<span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
											Mood
										</span>
									</div>
									<p className="text-sm font-medium text-neutral-900">{metadata.mood}</p>
								</div>
							)}

							{metadata.status && (
								<div className="p-3 rounded-lg bg-blue-50/40">
									<div className="flex items-center gap-2 mb-1.5">
										<RiFlashlightLine className="w-4 h-4 text-blue-600" />
										<span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
											Status
										</span>
									</div>
									<p className="text-sm font-medium text-neutral-900">{metadata.status}</p>
								</div>
							)}
						</div>
					)}

					{metadata.about && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<RiQuoteText className="w-3.5 h-3.5 text-neutral-400" />
								<h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
									About
								</h3>
							</div>
							<p className="text-sm leading-relaxed text-neutral-700 p-3 rounded-lg bg-neutral-50/50">
								{metadata.about}
							</p>
						</div>
					)}

					{metadata.tags && metadata.tags.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<RiPriceTag3Line className="w-3.5 h-3.5 text-neutral-400" />
								<h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
									Tags
								</h3>
							</div>
							<div className="flex flex-wrap gap-2">
								{metadata.tags.map((tag, idx) => (
									<span
										key={idx}
										className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getTagColor(idx)}`}
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					)}

					{metadata.quirks && metadata.quirks.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<RiLightbulbFlashLine className="w-3.5 h-3.5 text-neutral-400" />
								<h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
									Quirks
								</h3>
							</div>
							<div className="space-y-2">
								{metadata.quirks.map((quirk, idx) => (
									<div
										key={idx}
										className="flex items-start gap-2.5 p-3 rounded-lg bg-white/50"
									>
										<div className="w-5 h-5 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
											<span className="text-[10px] text-neutral-600">✦</span>
										</div>
										<span className="text-sm text-neutral-700 leading-relaxed flex-1">
											{quirk}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{user.createdAt && (
						<div className="pt-4 border-t border-neutral-200/30">
							<div className="flex items-center gap-2.5 p-3">
								<BiTime className="w-4 h-4 text-lime-600" />
								<div className="flex flex-col">
									<span className="text-[10px] text-slate-500 font-medium">
										Member since
									</span>
									<span className="text-sm font-semibold text-lime-700">
										{formatTime(user.createdAt)}
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
