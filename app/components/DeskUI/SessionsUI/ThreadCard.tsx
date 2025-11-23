'use client';

import React, { useEffect, useState } from 'react';
import { FaCircle, FaClock } from 'react-icons/fa';
import { FiBell } from 'react-icons/fi';

import { FireAvatar } from '@/app/components/UI';
import type { FireProfile, InboxThread } from '@/app/lib/types';
import { getUserByUid } from '@/app/lib/utils/memory';
import { formatTime } from '@/app/lib/utils/time';

interface InboxThreadCardProps {
	thread: InboxThread;
	currentUser: FireProfile;
	onOpenInbox?: (threadId: string) => void;
}

export function InboxThreadCard({ thread, currentUser, onOpenInbox }: InboxThreadCardProps) {
	const otherParticipants = thread.participants.filter((p) => p !== currentUser.uid);
	const hasUnread = (thread.unreadCount || 0) > 0;

	const [avatars, setAvatars] = useState<Record<string, string | null>>({});
	const [names, setNames] = useState<Record<string, string>>({});

	useEffect(() => {
		let active = true;

		const load = async () => {
			const mapAv: Record<string, string | null> = {};
			const mapNames: Record<string, string> = {};

			await Promise.all(
				(otherParticipants || []).map(async (uid) => {
					const u = await getUserByUid(uid);
					mapAv[uid] = u?.avatarUrl || null;
					mapNames[uid] = u?.usernamey ? `@${u.usernamey}` : `@${u?.displayName}`;
				})
			);

			if (active) {
				setAvatars(mapAv);
				setNames(mapNames);
			}
		};

		if (otherParticipants.length) void load();

		return () => {
			active = false;
		};
	}, [otherParticipants]);

	const header =
		otherParticipants.length === 0
			? 'No participants'
			: otherParticipants.length === 1
				? (names[otherParticipants[0]] ?? `@${otherParticipants[0]}`)
				: otherParticipants.length <= 3
					? otherParticipants.map((p) => names[p] ?? `@${p}`).join(', ')
					: `${otherParticipants.length} people`;

	return (
		<button
			onClick={() => onOpenInbox?.(thread.id)}
			className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-sm
				${
					hasUnread
						? 'bg-orange-50/50 border-orange-200/40 hover:border-orange-300/50 dark:bg-orange-900/20 dark:border-orange-700/40 dark:hover:border-orange-600/50'
						: 'bg-white border-neutral-200/40 hover:border-neutral-300/50 dark:bg-neutral-900/20 dark:border-neutral-700/40 dark:hover:border-neutral-600/50'
				}`}
		>
			<div className="flex items-start gap-4">
				<div className="flex -space-x-2">
					{otherParticipants.slice(0, 3).map((participant) => (
						<FireAvatar
							key={participant}
							seed={participant}
							size={40}
							src={avatars[participant] ?? undefined}
							className="ring-2 ring-white dark:ring-neutral-900"
						/>
					))}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<h4 className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
							{header}
						</h4>

						{hasUnread && (
							<div className="flex items-center gap-1">
								<FiBell className="w-5 h-5 text-orange-500 dark:text-orange-400" />
								<span className="px-2 py-0.5 bg-orange-500 dark:bg-orange-600 text-white text-xs font-bold rounded-full">
									{thread.unreadCount}
								</span>
							</div>
						)}
					</div>

					{thread.lastMessage && (
						<>
							<p className="text-sm text-neutral-600 dark:text-neutral-400 truncate mb-1">
								{thread.lastMessage.text}
							</p>
							<div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
								<FaClock className="w-3 h-3" />
								<span>
									{formatTime(thread.lastMessage.timestamp, 'en-US', {
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
						</>
					)}
				</div>

				{hasUnread && (
					<div className="flex-shrink-0">
						<FaCircle className="w-2 h-2 text-orange-500 dark:text-orange-400" />
					</div>
				)}
			</div>
		</button>
	);
}
