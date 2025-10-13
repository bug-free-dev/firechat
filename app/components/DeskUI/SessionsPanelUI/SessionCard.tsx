'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
	FaBan,
	FaClock,
	FaEllipsisV,
	FaFire,
	FaLock,
	FaShare,
	FaSignOutAlt,
	FaUsers,
} from 'react-icons/fa';

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
		? { icon: FaFire, text: 'Active', color: 'text-green-500', bg: 'bg-green-50' }
		: session.isLocked
			? { icon: FaLock, text: 'Locked', color: 'text-red-500', bg: 'bg-red-50' }
			: { icon: FaBan, text: 'Ended', color: 'text-neutral-500', bg: 'bg-neutral-50' };

	const StatusIcon = statusConfig.icon;

	// Determine border styling based on state
	const borderClass = isInvited
		? 'border-dashed border-orange-300 hover:border-orange-400'
		: session.isActive
			? 'border-neutral-300 hover:border-neutral-400'
			: 'border-neutral-200 hover:border-neutral-300';

	const handleJoinClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		onJoinSession?.(session?.id ?? '');
	};

	// Close menu when clicking outside
	useEffect(() => {
		if (!menuOpen) return;

		const handleClickOutside = () => setMenuOpen(false);
		document.addEventListener('click', handleClickOutside);

		return () => document.removeEventListener('click', handleClickOutside);
	}, [menuOpen]);

	return (
		<div
			className={`group relative bg-white rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-sm ${borderClass} ${
				isParticipant && session.isActive ? 'cursor-pointer' : ''
			}`}
		>
			{/* Active pulse indicator */}
			{session.isActive && (
				<div className="absolute -top-1 -right-1 w-3 h-3">
					<span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
				</div>
			)}

			{/* Invited badge overlay */}
			{isInvited && (
				<div className="absolute -top-2 -left-2 px-2 py-1 bg-neutral-500 text-white text-xs font-semibold rounded-full shadow-sm">
					💌 Invited
				</div>
			)}

			{/* Debug badge - shows identifier requirement */}
			{session.identifierRequired && (
				<div className="absolute -top-2 left-16 px-2 py-1 bg-indigo-400 text-white text-xs font-semibold rounded-full shadow-sm">
					🔐 Secure
				</div>
			)}

			{/* Header: Time + Menu */}
			<div className="flex items-start justify-between mb-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 text-xs text-neutral-500">
						<FaClock className="w-3 h-3" />
						<span>{formatTime(session.createdAt)}</span>
					</div>
				</div>

				{/* Menu button - only for creator, hidden for invited */}
				{isCreator && !isInvited && (
					<div className="relative">
						<button
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setMenuOpen(!menuOpen);
							}}
							className="p-2 rounded-md hover:bg-neutral-100 transition"
							aria-label="Session options"
						>
							<FaEllipsisV className="w-4 h-4 text-neutral-600" />
						</button>

						{menuOpen && (
							<div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 z-20">
								{onEndSession && session.isActive && (
									<button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onEndSession(session.id || '');
											setMenuOpen(false);
										}}
										className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 text-left rounded-t-lg"
									>
										<FaBan className="w-3 h-3" />
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
										className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 text-left"
									>
										<FaLock className="w-3 h-3" />
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
										className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 text-left rounded-b-lg"
									>
										<FaShare className="w-3 h-3" />
										Invite & Copy link
									</button>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Status badge */}
			<div
				className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bg} mb-4`}
			>
				<StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
				<span className={`text-xs font-medium ${statusConfig.color}`}>
					{isInvited ? 'Invited' : statusConfig.text}
				</span>
			</div>

			{/* Title section */}
			<div className="mb-4">
				<h3 className="font-semibold text-neutral-800 truncate text-base mb-1">
					{session.title || 'Untitled Session'}
				</h3>
				{isInvited && <p className="text-xs text-neutral-600">Invited by {creatorName}</p>}
			</div>

			{/* Participants section */}
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-2">
					<FaUsers className="w-4 h-4 text-neutral-500" />
					<span className="text-sm font-medium text-neutral-700">
						{session.participants?.length || 0} participant
						{(session.participants?.length || 0) !== 1 ? 's' : ''}
					</span>
				</div>

				<div className="flex items-center gap-2">
					{(session.participants || []).slice(0, 5).map((uid) => (
						<FireAvatar key={uid} seed={uid} size={32} src={avatars[uid]} />
					))}
					{(session.participants?.length || 0) > 5 && (
						<div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
							+{(session.participants?.length || 0) - 5}
						</div>
					)}
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex gap-2">
				{/* Invited user: "Join Now" button */}
				{isInvited && session.isActive && onJoinSession && (
					<button
						onClick={handleJoinClick}
						className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2.5 text-sm font-semibold rounded-lg text-white bg-neutral-800 hover:shadow-md hover:bg-neutral-800/70 transition"
					>
						<FaFire className="w-3 h-3" />
						Join Now
					</button>
				)}

				{/* Participant: Leave button */}
				{isParticipant && !isInvited && session.isActive && onLeaveSession && (
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onLeaveSession(session.id || '');
						}}
						className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-sm font-semibold rounded-lg text-[#ff3e00] bg-white border-2 border-[#ff3e00] hover:bg-[#fff2ee] transition"
					>
						<FaSignOutAlt className="w-3 h-3" />
						Leave
					</button>
				)}

				{/* Non-participant, non-invited: Join button */}
				{!isParticipant && !isInvited && session.isActive && onJoinSession && (
					<button
						onClick={handleJoinClick}
						className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-sm font-semibold rounded-lg text-white bg-neutral-800 hover:bg-neutral-700 transition"
					>
						<FaFire className="w-3 h-3" />
						Join
					</button>
				)}

				{/* Participant: Open Room button */}
				{isParticipant && !isInvited && session.isActive && (
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							if (session.id) {
								router.push(`/room/${session.id}`);
							}
						}}
						className="flex-1 inline-flex items-center justify-center px-2 py-1 text-sm font-semibold rounded-lg text-neutral-700 bg-transparent hover:bg-neutral-50 transition"
					>
						Open Room
					</button>
				)}
			</div>

			{/* Visual indicator for clickable cards */}
			{isParticipant && !isInvited && session.isActive && (
				<div className="absolute bottom-2 right-2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
					Click to open
				</div>
			)}
		</div>
	);
}
