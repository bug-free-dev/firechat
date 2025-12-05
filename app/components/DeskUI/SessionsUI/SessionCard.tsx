'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
	FiClock,
	FiHeart,
	FiLock,
	FiLogOut,
	FiMoreVertical,
	FiShare2,
	FiUsers,
	FiXCircle,
} from 'react-icons/fi';
import { MdOutlineShield } from 'react-icons/md';
import { RiFireLine } from 'react-icons/ri';

import { FireAvatar, FireButton } from '@/app/components/UI';
import { FireProfile, SessionDoc } from '@/app/lib/types';
import { getUserByUid } from '@/app/lib/utils/memory';
import { formatTime } from '@/app/lib/utils/time';

interface SessionCardProps {
	session: SessionDoc;
	currentUser: FireProfile;
	isCreator: boolean;
	isParticipant: boolean;
	isInvited?: boolean;
	onJoinSession?: (sessionId: string) => void;
	onLeaveSession?: (sessionId: string) => void;
	onEndSession?: (sessionId: string) => void;
	onLockSession?: (sessionId: string) => void;
	onInvite?: (session: SessionDoc) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
	session,
	isCreator,
	isParticipant,
	isInvited = false,
	onJoinSession,
	onLeaveSession,
	onEndSession,
	onLockSession,
	onInvite,
}) => {
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
	const [avatars, setAvatars] = useState<Record<string, string | null>>({});
	const [creatorName, setCreatorName] = useState<string>('');

	useEffect(() => {
		if (!session.creator) {
			setCreatorName('@unknown');
			return;
		}
		let mounted = true;
		void (async () => {
			try {
				const user = await getUserByUid(session.creator);
				if (!mounted) return;
				if (!user) {
					setCreatorName('@unknown');
					return;
				}
				if (user.usernamey && user.usernamey.trim().length > 0) {
					setCreatorName(`@${user.usernamey}`);
				} else if (user.displayName && user.displayName.trim().length > 0) {
					setCreatorName(`@${user.displayName}`);
				} else {
					setCreatorName(`@${session.creator.slice(0, 6)}`);
				}
			} catch {
				if (mounted) setCreatorName('@unknown');
			}
		})();
		return () => {
			mounted = false;
		};
	}, [session.creator]);

	const participantIds = useMemo(
		() => session.participants?.join(',') || '',
		[session.participants]
	);

	useEffect(() => {
		let active = true;
		const loadAvatars = async () => {
			const map: Record<string, string | null> = {};
			await Promise.all(
				(session.participants || []).map(async (uid) => {
					const u = await getUserByUid(uid);
					map[uid] = u?.avatarUrl || null;
				})
			);
			if (active) setAvatars(map);
		};
		if (session.participants?.length) void loadAvatars();
		return () => {
			active = false;
		};
	}, [participantIds, session.participants]);

	const statusConfig = session.isActive
		? {
				icon: RiFireLine,
				text: 'Active',
				color: 'text-yellow-600 dark:text-yellow-400',
				bg: 'bg-yellow-50/60 dark:bg-yellow-900/30',
				border: 'border-yellow-200/60 dark:border-yellow-700/30',
			}
		: session.isLocked
			? {
					icon: FiLock,
					text: 'Locked',
					color: 'text-red-600 dark:text-red-400',
					bg: 'bg-red-50/60 dark:bg-red-900/28',
					border: 'border-red-200/60 dark:border-red-700/30',
				}
			: {
					icon: FiXCircle,
					text: 'Ended',
					color: 'text-neutral-500 dark:text-neutral-400',
					bg: 'bg-neutral-50/60 dark:bg-neutral-950/40',
					border: 'border-neutral-200/40 dark:border-neutral-700/40',
				};

	const StatusIcon = statusConfig.icon as React.ElementType;

	const borderClass = isInvited
		? 'border-2 border-dashed border-orange-300/85 dark:border-orange-300/70 outline-none'
		: 'border-2 border-neutral-200/40 dark:border-neutral-700/40 outline-none';

	const handleJoinClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onJoinSession?.(session?.id ?? '');
	};

	useEffect(() => {
		if (!menuOpen) return;
		const handleClickOutside = () => setMenuOpen(false);
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [menuOpen]);

	return (
		<div
			className={`group relative bg-white/10 dark:bg-neutral-950 rounded-2xl p-4 transition-all duration-200 hover:shadow dark:hover:shadow-lg ${borderClass}`}
			onClick={() => {
				if (isParticipant && !isInvited && session.isActive && session.id) {
					router.push(`/room/${session.id}`);
				}
			}}
		>
			{/* Active pulse */}
			{session.isActive && (
				<div className="absolute -top-1 -right-1 w-2.5 h-2.5">
					<span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-emerald-400 opacity-60 animate-ping" />
				</div>
			)}

			{/* Invited badge */}
			{isInvited && (
				<div className="absolute -top-3 -left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-orange-600 dark:text-orange-400 bg-white/70 dark:bg-neutral-800/70 border border-orange-300/60 dark:border-orange-300/50 border-dashed backdrop-blur-sm">
					<FiHeart className="w-4 h-4" />
					<span>Invited</span>
				</div>
			)}

			{/* Secure badge */}
			{session.identifierRequired && (
				<div className="absolute -top-2 left-16 px-2 py-0.5 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
					<MdOutlineShield className="w-3 h-3" />
					Secure
				</div>
			)}

			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
						<FiClock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
						<span>
							{formatTime(session.createdAt, 'en-US', {
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

				{/* Menu for creator */}
				{isCreator && !isInvited && (
					<div className="relative">
						<FireButton
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setMenuOpen(!menuOpen);
							}}
							aria-label="Session options"
							variant="ghost"
							size="xs"
						>
							<FiMoreVertical className="w-5 h-5 drop-shadow-sm" />
						</FireButton>

						{menuOpen && (
							<div className="absolute right-0 mt-2 w-45 bg-white dark:bg-neutral-950 rounded-lg shadow-lg dark:shadow-sm border border-neutral-200 dark:border-neutral-700/40 z-20 p-1.5">
								{onEndSession && session.isActive && (
									<FireButton
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onEndSession(session.id || '');
											setMenuOpen(false);
										}}
										variant="ghost"
										size="xs"
										className="w-full justify-start gap-2"
									>
										<FiXCircle className="w-4 h-4" />
										End Session
									</FireButton>
								)}

								{onLockSession && session.isActive && (
									<FireButton
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onLockSession(session.id || '');
											setMenuOpen(false);
										}}
										variant="ghost"
										size="xs"
										className="w-full justify-start gap-2 text-neutral-700 dark:text-neutral-200"
									>
										<FiLock className="w-4 h-4" />
										{session.isLocked ? 'Unlock' : 'Lock'}
									</FireButton>
								)}

								{onInvite && (
									<FireButton
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onInvite(session);
											setMenuOpen(false);
										}}
										variant="ghost"
										size="xs"
										className="w-full justify-start gap-2 text-neutral-700 dark:text-neutral-200"
									>
										<FiShare2 className="w-4 h-4" />
										Invite & Copy link
									</FireButton>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			{/* status pill */}
			<div
				className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} mb-3`}
			>
				<StatusIcon className={`w-4 h-4 ${statusConfig.color} drop-shadow-sm`} />
				<span className={`text-xs font-medium ${statusConfig.color}`}>
					{isInvited ? 'Invited' : statusConfig.text}
				</span>
			</div>

			<div className="mb-3">
				<h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-sm mb-0.5">
					{session.title || 'Untitled Session'}
				</h3>
				{isInvited && (
					<p className="text-xs text-neutral-500 dark:text-neutral-400">
						Invited by {creatorName}
					</p>
				)}
			</div>

			<div className="mb-3">
				<div className="flex items-center gap-2 mb-2">
					<FiUsers className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
					<span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
						{session.participants?.length || 0} participant
						{(session.participants?.length || 0) !== 1 ? 's' : ''}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					{(session.participants || []).slice(0, 5).map((uid) => (
						<FireAvatar key={uid} seed={uid} size={28} src={avatars[uid]} />
					))}
					{(session.participants?.length || 0) > 5 && (
						<div className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
							+{(session.participants?.length || 0) - 5}
						</div>
					)}
				</div>
			</div>

			<div className="flex gap-2">
				{/* invited join */}
				{isInvited && session.isActive && onJoinSession && (
					<FireButton
						onClick={handleJoinClick}
						variant="default"
						size="sm"
						className="flex-1 gap-2"
					>
						<RiFireLine className="w-5 h-5" />
						Join Now
					</FireButton>
				)}

				{/* Creator: End Session */}
				{isCreator && !isInvited && session.isActive && onEndSession && (
					<FireButton
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onEndSession(session.id || '');
						}}
						variant="default"
						destructive={true}
						size="sm"
						className="flex-1 gap-2"
					>
						<FiXCircle className="w-5 h-5" />
						End Session
					</FireButton>
				)}

				{/* Participant: Leave */}
				{!isCreator && isParticipant && !isInvited && session.isActive && onLeaveSession && (
					<FireButton
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onLeaveSession(session.id || '');
						}}
						variant="outline"
						size="sm"
						destructive={true}
						className="flex-1 gap-2"
					>
						<FiLogOut className="w-5 h-5" />
						Leave
					</FireButton>
				)}

				{/* Join for non-participants */}
				{!isParticipant && !isInvited && session.isActive && onJoinSession && (
					<FireButton
						onClick={handleJoinClick}
						variant="secondary"
						size="sm"
						className="flex-1 gap-2"
					>
						<RiFireLine className="w-5 h-5" />
						Join
					</FireButton>
				)}

				{/* Open room for participants */}
				{isParticipant && !isInvited && session.isActive && (
					<FireButton
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							if (session.id) router.push(`/room/${session.id}`);
						}}
						size="sm"
						className="flex-1 gap-2"
					>
						Open Room
					</FireButton>
				)}
			</div>

			{isParticipant && !isInvited && session.isActive && (
				<div className="absolute -top-1 right-2 text-[10px] text-neutral-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
					Click to open
				</div>
			)}
		</div>
	);
};
