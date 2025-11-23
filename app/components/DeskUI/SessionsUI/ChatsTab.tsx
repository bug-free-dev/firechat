'use client';

import React, { useMemo } from 'react';
import { IoAddOutline, IoChatbubblesOutline } from 'react-icons/io5';
import { MdOutlineWhatshot } from 'react-icons/md';

import { FireButton, WaveLoader } from '@/app/components/UI';
import { CachedUser, FireProfile, SessionDoc } from '@/app/lib/types';
import { compare } from '@/app/lib/utils/time';

import { FrequentUsers } from './FreqUsers';
import { SessionCard } from './SessionCard';

interface ChatsTabProps {
	sessions: SessionDoc[];
	invitedSessions?: SessionDoc[];
	currentUser: FireProfile;
	frequentUsers: CachedUser[];
	isCreator: (session: SessionDoc) => boolean;
	isParticipant: (session: SessionDoc) => boolean;
	onCreateSession?: () => void;
	onJoinSession?: (sessionId: string) => void;
	onLeaveSession?: (sessionId: string) => void;
	onEndSession?: (sessionId: string) => void;
	onLockSession?: (sessionId: string) => void;
	onInvite?: (session: SessionDoc) => void;
	loading: boolean;
}

export const ChatsTab: React.FC<ChatsTabProps> = ({
	sessions = [],
	invitedSessions = [],
	currentUser,
	frequentUsers = [],
	isCreator,
	isParticipant,
	onCreateSession,
	onJoinSession,
	onLeaveSession,
	onEndSession,
	onLockSession,
	onInvite,
	loading,
}) => {
	const invitedIds = useMemo(
		() => new Set((invitedSessions || []).map((s) => s.id)),
		[invitedSessions]
	);

	const mergedSessions = useMemo(() => {
		const map = new Map<string, SessionDoc>();
		(sessions || []).forEach((s) => {
			if (s?.id) map.set(s.id, s);
		});
		(invitedSessions || []).forEach((s) => {
			if (s?.id && !map.has(s.id)) map.set(s.id, s);
		});
		const arr = Array.from(map.values());
		arr.sort((a, b) => {
			if (a.isActive === b.isActive) {
				return compare.desc(a.createdAt, b.createdAt);
			}
			return a.isActive ? -1 : 1;
		});
		return arr;
	}, [sessions, invitedSessions]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<IoChatbubblesOutline className="w-12 h-12 mx-auto mb-4 text-zinc-400/50 dark:text-zinc-400/40" />
					<WaveLoader />
				</div>
			</div>
		);
	}

	return (
		<>
			{frequentUsers.length > 0 && (
				<FrequentUsers users={frequentUsers} currentUser={currentUser} />
			)}

			{mergedSessions.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<MdOutlineWhatshot className="w-20 h-20 mb-6 text-zinc-300/50 dark:text-zinc-400/40" />
					<h3 className="text-4xl font-knewave text-neutral-800 dark:text-neutral-100 mb-3">
						No sparks yet
					</h3>
					<p className="font-comic text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
						Fire up your first session and start a conversation!
					</p>
					{onCreateSession && (
						<FireButton onClick={onCreateSession}>
							<IoAddOutline className="w-5 h-5" />
							Fire Up a Session
						</FireButton>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{mergedSessions.map((session) => (
						<SessionCard
							key={session.id}
							session={session}
							currentUser={currentUser}
							isCreator={isCreator(session)}
							isParticipant={isParticipant(session)}
							isInvited={Boolean(invitedIds.has(session.id))}
							onJoinSession={onJoinSession}
							onLeaveSession={onLeaveSession}
							onEndSession={onEndSession}
							onLockSession={onLockSession}
							onInvite={onInvite}
						/>
					))}
				</div>
			)}
		</>
	);
};
