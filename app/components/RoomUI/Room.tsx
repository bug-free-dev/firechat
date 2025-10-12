'use client';

import { DataSnapshot, off as rtdbOff, onValue, ref as rtdbRef } from 'firebase/database';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import RoomUI from '@/app/components/RoomUI/RoomUI';
import { FireLoader } from '@/app/components/UI/FireLoader';
import * as messageAPI from '@/app/lib/api/messageAPI';
import * as sessionAPI from '@/app/lib/api/sessionAPI';
import { rtdb } from '@/app/lib/firebase/FireClient';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import type { FireCachedUser, SessionDoc } from '@/app/lib/types';
import { getAllCachedUsers, getFrequentUsers } from '@/app/lib/utils/memory';
import { RTDBSessionMetadata, RTDBInvitedUser, RTDBParticipant } from '@/app/lib/types';

interface RTDBSessionValue {
	metadata?: RTDBSessionMetadata;
	invited?: Record<string, RTDBInvitedUser>;
	participants?: Record<string, RTDBParticipant>;
}

export default function Room() {
	const params = useParams();
	const router = useRouter();
	const sessionId = params?.sessionId as string | undefined;

	const { profile, isLoading: profileLoading } = useAuthState();

	const [session, setSession] = useState<SessionDoc | null>(null);
	const [profiles, setProfiles] = useState<Record<string, FireCachedUser>>({});
	const [frequentUsers, setFrequentUsers] = useState<FireCachedUser[]>([]);
	const [allUsers, setAllUsers] = useState<FireCachedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Memoized message services
	const messageServices = useMemo(
		() => ({
			sendMessage: messageAPI.sendMessage,
			getMessages: messageAPI.getMessages,
			addReaction: messageAPI.addReaction,
			removeReaction: messageAPI.removeReaction,
			deleteMessage: messageAPI.deleteMessage,
		}),
		[]
	);

	// Load user profiles
	useEffect(() => {
		if (!profile?.uid) return;

		let cancelled = false;

		void (async () => {
			try {
				const [cached, frequent] = await Promise.all([
					getAllCachedUsers(),
					getFrequentUsers(profile.uid, 10),
				]);

				if (cancelled) return;

				setAllUsers(cached);
				setFrequentUsers(frequent);

				const profilesMap: Record<string, FireCachedUser> = {};
				cached.forEach((user) => {
					profilesMap[user.uid] = user;
				});
				setProfiles(profilesMap);
			} catch {
				setError('Failed to load user data');
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [profile?.uid]);

	// Real-time session listener
	useEffect(() => {
		if (!sessionId || !profile?.uid || !rtdb) return;

		setLoading(true);
		setError(null);

		const sessionRef = rtdbRef(rtdb, `liveSessions/${sessionId}`);

		const handleSessionUpdate = (snapshot: DataSnapshot) => {
			try {
				const val = snapshot.val() as RTDBSessionValue | null;
				if (!val?.metadata) {
					setError('Session not found');
					setLoading(false);
					return;
				}

				const meta = val.metadata;
				const invitedUids = Object.keys(val.invited ?? {});
				const participantUids = Object.keys(val.participants ?? {});
				const isAuthorized =
					participantUids.includes(profile.uid) ||
					invitedUids.includes(profile.uid) ||
					meta.creator === profile.uid;

				if (!isAuthorized) {
					setError('Not authorized to view this session');
					setLoading(false);
					return;
				}

				setSession({
					id: sessionId,
					title: meta.title,
					creator: meta.creator,
					participants: participantUids,
					joinedUsers: participantUids,
					isLocked: meta.isLocked,
					identifierRequired: meta.identifierRequired,
					isActive: meta.status === 'active',
					createdAt: meta.createdAt,
					meta: { invitedUids },
				});
				setLoading(false);
			} catch {
				setError('Failed to load session');
				setLoading(false);
			}
		};

		const handleError = (err: unknown) => {
			const isPermissionDenied =
				typeof err === 'object' &&
				err !== null &&
				'code' in err &&
				(err as { code?: unknown }).code === 'permission-denied';
			setError(isPermissionDenied ? 'Not authorized to view this session' : 'Session over!');
			setLoading(false);
		};

		onValue(sessionRef, handleSessionUpdate, handleError);

		return () => {
			try {
				rtdbOff(sessionRef);
			} catch {}
		};
	}, [sessionId, profile?.uid]);

	/* ==================== SESSION ACTION HANDLERS ==================== */

	const handleEndSession = async (sid: string): Promise<void> => {
		if (!profile?.uid) return;
		try {
			const res = await sessionAPI.endSession(profile.uid, sid);
			if (res.ok) {
				toast.success('Session ended');
			}
		} catch {
			toast.error('Failed to end session');
		}
	};

	const handleLeaveSession = async (sid: string, uid: string): Promise<void> => {
		if (!uid) return;
		try {
			const res = await sessionAPI.leaveSession(uid, sid);
			if (res.ok) {
				toast.success('Left session');
			}
		} catch {
			toast.error('Failed to leave session');
		}
	};

	const handleAddParticipant = async (sid: string, uid: string): Promise<void> => {
		if (!uid) return;
		try {
			const res = await sessionAPI.addParticipant(sid, uid);
			if (!res.ok) toast.error('AddParticipant failed');
		} catch {
			toast.error('AddParticipant error');
		}
	};

	const handleToggleLock = async (sid: string, locked: boolean): Promise<void> => {
		if (!profile?.uid) return;
		try {
			const res = await sessionAPI.toggleLockSession(profile.uid, sid, locked);
			if (!res.ok) toast.error('ToggleLock failed');
		} catch {
			toast.error('ToggleLock error');
		}
	};

	const handleUpdateMetadata = async (
		sid: string,
		updates: { title?: string; identifierRequired?: boolean }
	): Promise<void> => {
		if (!profile?.uid || !updates || Object.keys(updates).length === 0) return;

		try {
			const res = await sessionAPI.updateSessionMetadata({
				callerUid: profile.uid,
				sessionId: sid,
				updates,
			});

			if (!res.ok) {
				return;
			}

			if (res.data) {
				setSession((prev) =>
					prev
						? {
								...prev,
								title: updates.title ?? prev.title,
								identifierRequired: updates.identifierRequired ?? prev.identifierRequired,
							}
						: prev
				);
			}
		} catch {}
	};

	// User fetch/search handlers
	const fetchFrequentUsersHandler = useCallback(
		async (_forUid: string): Promise<FireCachedUser[]> => {
			// Returns pre-loaded frequent users
			return frequentUsers;
		},
		[frequentUsers]
	);

	const searchUsersHandler = useCallback(
		async (query: string): Promise<FireCachedUser[]> => {
			if (!query.trim()) return [];

			const q = query.trim().toLowerCase();

			return allUsers.filter(
				(u) => u.usernamey.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
			);
		},
		[allUsers]
	);

	/* ==================== RENDER ==================== */

	if (profileLoading || loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-neutral-50">
				<FireLoader message="Loading session..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-neutral-50 gap-4">
				<p className="text-rose-500 font-medium">{error}</p>
				<button
					onClick={() => router.push('/desk')}
					className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
				>
					Back to Desk
				</button>
			</div>
		);
	}

	if (!session || !profile) {
		return (
			<div className="flex items-center justify-center h-screen bg-neutral-50">
				<p className="text-neutral-600">Session not found</p>
			</div>
		);
	}

	return (
		<RoomUI
			session={session}
			currentUser={profile as FireCachedUser}
			profiles={profiles}
			messageServices={messageServices}
			onEndSession={handleEndSession}
			onLeaveSession={handleLeaveSession}
			onAddParticipant={handleAddParticipant}
			onToggleLock={handleToggleLock}
			onUpdateMetadata={handleUpdateMetadata}
			fetchFrequentUsers={fetchFrequentUsersHandler}
			searchUsers={searchUsersHandler}
		/>
	);
}
