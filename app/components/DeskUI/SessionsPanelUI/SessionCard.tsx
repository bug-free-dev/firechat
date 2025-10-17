'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
	IoCloseCircleOutline,
	IoTimeOutline,
	IoEllipsisVerticalOutline,
	IoFlameOutline,
	IoLockClosedOutline,
	IoShareSocialOutline,
	IoLogOutOutline,
	IoPeopleOutline,
	IoShieldCheckmarkOutline,
} from 'react-icons/io5';

import FireAvatar from '@/app/components/UI/FireAvatar';
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

export function SessionCard({
	session,
	isCreator,
	isParticipant,
	isInvited = false,
	onJoinSession,
	onLeaveSession,
	onEndSession,
	onLockSession,
	onInvite,
}: SessionCardProps) {
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
				icon: IoFlameOutline,
				text: 'Active',
				color: 'text-emerald-600',
				bg: 'bg-emerald-50',
				border: 'border-emerald-200',
			}
		: session.isLocked
			? {
					icon: IoLockClosedOutline,
					text: 'Locked',
					color: 'text-red-600',
					bg: 'bg-red-50',
					border: 'border-red-200',
				}
			: {
					icon: IoCloseCircleOutline,
					text: 'Ended',
					color: 'text-neutral-500',
					bg: 'bg-neutral-50',
					border: 'border-neutral-200',
				};

	const StatusIcon = statusConfig.icon;

	const borderClass = isInvited
		? 'border-dashed border-orange-300 hover:border-orange-400'
		: session.isActive
			? 'border-neutral-200 hover:border-neutral-300'
			: 'border-neutral-200 hover:border-neutral-200';

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
			className={`group relative bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${borderClass} ${
				isParticipant && session.isActive ? 'cursor-pointer' : ''
			}`}
			onClick={() => {
				if (isParticipant && !isInvited && session.isActive && session.id) {
					router.push(`/room/${session.id}`);
				}
			}}
		>
			{session.isActive && (
				<div className="absolute -top-1 -right-1 w-2.5 h-2.5">
					<span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
					<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
				</div>
			)}

			{isInvited && (
				<div className="absolute -top-2 -left-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded-full shadow-sm">
					💌 Invited
				</div>
			)}

			{session.identifierRequired && (
				<div className="absolute -top-2 left-16 px-2 py-0.5 bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
					<IoShieldCheckmarkOutline className="w-3 h-3" />
					Secure
				</div>
			)}

			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 text-xs text-neutral-500">
						<IoTimeOutline className="w-3 h-3" />
						<span>{formatTime(session.createdAt)}</span>
					</div>
				</div>

				{isCreator && !isInvited && (
					<div className="relative">
						<button
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setMenuOpen(!menuOpen);
							}}
							className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
							aria-label="Session options"
						>
							<IoEllipsisVerticalOutline className="w-4 h-4 text-neutral-600" />
						</button>

						{menuOpen && (
							<div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 z-20 py-1">
								{onEndSession && session.isActive && (
									<button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onEndSession(session.id || '');
											setMenuOpen(false);
										}}
										className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 text-left transition-colors"
									>
										<IoCloseCircleOutline className="w-4 h-4" />
										End Session
									</button>
								)}
								{onLockSession && session.isActive && (
									<button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onLockSession(session.id || '');
											setMenuOpen(false);
										}}
										className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 text-left transition-colors"
									>
										<IoLockClosedOutline className="w-4 h-4" />
										{session.isLocked ? 'Unlock' : 'Lock'}
									</button>
								)}

								{onInvite && (
									<button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onInvite(session);
											setMenuOpen(false);
										}}
										className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 text-left transition-colors"
									>
										<IoShareSocialOutline className="w-4 h-4" />
										Invite & Copy link
									</button>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			<div
				className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.border} mb-3`}
			>
				<StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
				<span className={`text-xs font-medium ${statusConfig.color}`}>
					{isInvited ? 'Invited' : statusConfig.text}
				</span>
			</div>

			<div className="mb-3">
				<h3 className="font-semibold text-neutral-900 truncate text-sm mb-0.5">
					{session.title || 'Untitled Session'}
				</h3>
				{isInvited && <p className="text-xs text-neutral-500">Invited by {creatorName}</p>}
			</div>

			<div className="mb-3">
				<div className="flex items-center gap-2 mb-2">
					<IoPeopleOutline className="w-4 h-4 text-neutral-500" />
					<span className="text-xs font-medium text-neutral-600">
						{session.participants?.length || 0} participant
						{(session.participants?.length || 0) !== 1 ? 's' : ''}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					{(session.participants || []).slice(0, 5).map((uid) => (
						<FireAvatar key={uid} seed={uid} size={28} src={avatars[uid]} />
					))}
					{(session.participants?.length || 0) > 5 && (
						<div className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600">
							+{(session.participants?.length || 0) - 5}
						</div>
					)}
				</div>
			</div>

			<div className="flex gap-2">
				{isInvited && session.isActive && onJoinSession && (
					<button
						onClick={handleJoinClick}
						className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
					>
						<IoFlameOutline className="w-4 h-4" />
						Join Now
					</button>
				)}

				{isParticipant && !isInvited && session.isActive && onLeaveSession && (
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onLeaveSession(session.id || '');
						}}
						className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-red-600 bg-white border border-red-300 hover:bg-red-50 transition-colors"
					>
						<IoLogOutOutline className="w-4 h-4" />
						Leave
					</button>
				)}

				{!isParticipant && !isInvited && session.isActive && onJoinSession && (
					<button
						onClick={handleJoinClick}
						className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
					>
						<IoFlameOutline className="w-4 h-4" />
						Join
					</button>
				)}

				{isParticipant && !isInvited && session.isActive && (
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							if (session.id) {
								router.push(`/room/${session.id}`);
							}
						}}
						className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg text-neutral-700 bg-neutral-50 hover:bg-neutral-100 transition-colors"
					>
						Open Room
					</button>
				)}
			</div>

			{isParticipant && !isInvited && session.isActive && (
				<div className="absolute bottom-2 right-2 text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
					Click to open
				</div>
			)}
		</div>
	);
}
