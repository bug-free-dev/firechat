'use client';

import React, { useMemo } from 'react';
import { FaComments, FaPlus, FaFire } from 'react-icons/fa';

import FireButton from '@/app/components/UI/FireButton';
import { FireCachedUser, FireProfile, SessionDoc } from '@/app/lib/types';

import { FrequentUsers } from './FrequentUsers';
import { SessionCard } from './SessionCard';
import { compare } from '@/app/lib/utils/time';

interface ChatsTabProps {
	sessions: SessionDoc[];
	invitedSessions?: SessionDoc[];
	currentUser: FireProfile;
	frequentUsers: FireCachedUser[];
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

export function ChatsTab({
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
}: ChatsTabProps) {
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
					<FaComments className="w-15 h-15 mx-auto mb-4 text-orange-500/40" />
					<p className="text-neutral-500">Loading sessions...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* Frequent Users Section */}
			{frequentUsers.length > 0 && (
				<FrequentUsers users={frequentUsers} currentUser={currentUser} />
			)}

			{/* Single sessions grid (invites are rendered inline and flagged) */}
			{mergedSessions.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<FaFire className="w-20 h-20 mb-6 text-orange-300 opacity-50" />
					<h3 className="text-2xl font-dyna text-neutral-700 mb-2">No sparks yet</h3>
					<p className="text-neutral-500 mb-6 max-w-sm">
						Fire up your first session and start chatting with your classmates!
					</p>
					{onCreateSession && (
						<FireButton onClick={onCreateSession} className="flex items-center gap-2">
							<FaPlus className="w-4 h-4" />
							Fire Up a Session
						</FireButton>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
}
