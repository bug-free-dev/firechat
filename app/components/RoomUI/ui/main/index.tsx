'use client';

import { DataSnapshot, off as rtdbOff, onValue, ref as rtdbRef } from 'firebase/database';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Orchestra from '@/app/components/RoomUI/ui/main/Orchestra';
import { FireButton,FireLoader, FirePrompt } from '@/app/components/UI';
import * as messageAPI from '@/app/lib/api/messageAPI';
import * as sessionAPI from '@/app/lib/api/sessionAPI';
import { rtdb } from '@/app/lib/firebase/FireClient';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import type {
	CachedUser,
	RTDBInvitedUser,
	RTDBParticipant,
	RTDBSessionMetadata,
	SessionDoc,
} from '@/app/lib/types';
import { getAllCachedUsers, getFrequentUsers } from '@/app/lib/utils/memory';

interface RTDBSessionValue {
	metadata?: RTDBSessionMetadata;
	invited?: Record<string, RTDBInvitedUser>;
	participants?: Record<string, RTDBParticipant>;
}

type AccessState = 'checking' | 'needs_identifier' | 'joining' | 'granted' | 'denied';

const MAX_ATTEMPTS = 3;

const Room: React.FC = React.memo(() => {
	const params = useParams();
	const router = useRouter();
	const sessionId = params?.sessionId as string | undefined;
	const { profile, isLoading: profileLoading, verifyIdentifier } = useAuthState();

	const [session, setSession] = useState<SessionDoc | null>(null);
	const [profiles, setProfiles] = useState<Record<string, CachedUser>>({});
	const [frequentUsers, setFrequentUsers] = useState<CachedUser[]>([]);
	const [allUsers, setAllUsers] = useState<CachedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [accessState, setAccessState] = useState<AccessState>('checking');
	const [identifierValue, setIdentifierValue] = useState('');
	const [attempts, setAttempts] = useState(0);

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

	// Load user profiles once
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
				setProfiles(Object.fromEntries(cached.map((u) => [u.uid, u])));
			} catch {
				// Non-critical failure
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [profile?.uid]);

	const handleJoinError = useCallback((errorCode: string) => {
		const errorMap: Record<string, () => void> = {
			IDENTIFIER_REQUIRED: () => {
				setAccessState('needs_identifier');
				toast('This session requires your secret key');
			},
			IDENTIFIER_INVALID: () => {
				setAttempts((prev) => {
					const next = prev + 1;
					const remaining = MAX_ATTEMPTS - next;
					if (next >= MAX_ATTEMPTS) {
						toast('Access denied after 3 failed attempts');
						setAccessState('denied');
						setError('Access denied after 3 failed attempts');
					} else {
						toast(
							`Incorrect key. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining`
						);
						setAccessState('needs_identifier');
					}
					return next;
				});
			},
			SESSION_INACTIVE: () => {
				setAccessState('denied');
				setError('This session has ended');
			},
			NOT_FOUND: () => {
				setAccessState('denied');
				setError('Session not found');
			},
			USER_NOT_FOUND: () => {
				setAccessState('denied');
				setError('Your profile could not be loaded');
			},
		};

		const handler = errorMap[errorCode];
		if (handler) {
			handler();
		} else {
			toast('Unable to join session');
			setAccessState('denied');
			setError('Access denied');
		}
	}, []);

	const attemptJoin = useCallback(
		async (sid: string, identifier?: string) => {
			if (!profile?.uid) return;

			setAccessState('joining');

			try {
				const res = await sessionAPI.joinSession({
					userUid: profile.uid,
					sessionId: sid,
					identifierInput: identifier,
				});

				if (res.ok) {
					setAccessState('granted');
					toast.success('Welcome to the session!');
				} else {
					handleJoinError(res.error);
				}
			} catch {
				toast('Could not join session right now');
				setAccessState('needs_identifier');
			}
		},
		[profile?.uid, handleJoinError]
	);

	const handleRTDBError = useCallback((err: unknown) => {
		const isPermissionDenied =
			typeof err === 'object' &&
			err !== null &&
			'code' in err &&
			(err as { code?: unknown }).code === 'permission-denied';

		setError(
			isPermissionDenied ? 'You need permission to view this session' : 'Session unavailable!'
		);
		setAccessState('denied');
		setLoading(false);
	}, []);

	// Main session listener
	useEffect(() => {
		if (!sessionId || !profile?.uid || !rtdb) return;

		setLoading(true);
		setError(null);
		setAccessState('checking');

		const sessionRef = rtdbRef(rtdb, `liveSessions/${sessionId}`);

		const handleSessionUpdate = (snapshot: DataSnapshot) => {
			try {
				const val = snapshot.val() as RTDBSessionValue | null;

				if (!val?.metadata) {
					setError('This session no longer exists');
					setAccessState('denied');
					setLoading(false);
					return;
				}

				const meta = val.metadata;
				const invitedUids = Object.keys(val.invited ?? {});
				const participantUids = Object.keys(val.participants ?? {});

				const isParticipant = participantUids.includes(profile.uid);
				const isInvited = invitedUids.includes(profile.uid);
				const isCreator = meta.creator === profile.uid;

				const sessionDoc: SessionDoc = {
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
				};

				setSession(sessionDoc);

				// Access control logic
				if (isParticipant || isCreator) {
					setAccessState('granted');
					setLoading(false);
					return;
				}

				if (isInvited) {
					if (meta.identifierRequired) {
						setAccessState('needs_identifier');
						setLoading(false);
						return;
					}
					setAccessState('joining');
					void attemptJoin(sessionId, undefined);
					return;
				}

				setError('You need an invitation to join this session');
				setAccessState('denied');
				setLoading(false);
			} catch {
				setError('Failed to load session');
				setAccessState('denied');
				setLoading(false);
			}
		};

		onValue(sessionRef, handleSessionUpdate, handleRTDBError);

		return () => {
			try {
				rtdbOff(sessionRef);
			} catch {
				// Silent cleanup
			}
		};
	}, [sessionId, profile?.uid, attemptJoin, handleRTDBError]);

	const handleIdentifierVerify = useCallback(
		async (input: string): Promise<boolean> => {
			if (!verifyIdentifier) return false;
			try {
				return await verifyIdentifier(input);
			} catch {
				return false;
			}
		},
		[verifyIdentifier]
	);

	const handleIdentifierSubmit = useCallback(async () => {
		if (!sessionId || !identifierValue.trim()) return;

		const locallyValid = await handleIdentifierVerify(identifierValue);
		if (!locallyValid) {
			setAttempts((prev) => {
				const next = prev + 1;
				const remaining = MAX_ATTEMPTS - next;
				if (next >= MAX_ATTEMPTS) {
					toast('Too many failed attempts. Contact the creator for help');
					setAccessState('denied');
					setError('Access denied after 3 failed attempts');
				} else {
					toast(
						`That's not the right key. ${remaining} attempt${remaining === 1 ? '' : 's'} left`
					);
					setAccessState('needs_identifier');
				}
				return next;
			});
			return;
		}

		await attemptJoin(sessionId, identifierValue);
	}, [sessionId, identifierValue, handleIdentifierVerify, attemptJoin]);

	const handleEndSession = useCallback(
		async (sid: string): Promise<void> => {
			if (!profile?.uid) return;
			try {
				const res = await sessionAPI.endSession(profile.uid, sid);
				if (res.ok) {
					toast.success('Session ended successfully');
					router.push('/desk');
				} else {
					toast('Could not end session');
				}
			} catch {
				toast('Failed to end session');
			}
		},
		[profile?.uid, router]
	);

	const handleLeaveSession = useCallback(
		async (sid: string, uid: string): Promise<void> => {
			if (!uid) return;
			try {
				const res = await sessionAPI.leaveSession(uid, sid);
				if (res.ok) {
					toast.success('You left the session');
					router.push('/desk');
				} else {
					toast('Could not leave session');
				}
			} catch {
				toast('Failed to leave session');
			}
		},
		[router]
	);

	const handleAddParticipant = useCallback(async (sid: string, uid: string): Promise<void> => {
		if (!uid) return;
		try {
			const res = await sessionAPI.addParticipant(sid, uid);
			if (!res.ok) toast('Person already invited');
		} catch {
			toast.error('Failed to add participant');
		}
	}, []);

	const handleToggleLock = useCallback(
		async (sid: string, locked: boolean): Promise<void> => {
			if (!profile?.uid) return;
			try {
				const res = await sessionAPI.toggleLockSession(profile.uid, sid, locked);
				if (res.ok) {
					toast.success(locked ? 'Session locked' : 'Session unlocked');
				} else {
					toast('Could not update lock status');
				}
			} catch {
				toast('Failed to toggle lock');
			}
		},
		[profile?.uid]
	);

	const handleUpdateMetadata = useCallback(
		async (
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

				if (res.ok && res.data) {
					setSession((prev) =>
						prev
							? {
									...prev,
									title: updates.title ?? prev.title,
									identifierRequired:
										updates.identifierRequired ?? prev.identifierRequired,
								}
							: prev
					);
					toast.success('Session updated');
				}
			} catch {
				// Silent fail
			}
		},
		[profile?.uid]
	);

	const fetchFrequentUsersHandler = useCallback(
		async (): Promise<CachedUser[]> => frequentUsers,
		[frequentUsers]
	);

	const searchUsersHandler = useCallback(
		async (query: string): Promise<CachedUser[]> => {
			if (!query.trim()) return [];
			const q = query.trim().toLowerCase();
			return allUsers.filter(
				(u) => u.usernamey.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
			);
		},
		[allUsers]
	);

	// Render states
	if (profileLoading || loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-neutral-50">
				<FireLoader />
			</div>
		);
	}

	if (accessState === 'needs_identifier' && session) {
		return (
			<FirePrompt
				open={true}
				onClose={() => router.push('/desk')}
				header={`Enter your secret key for ${session.title || 'session'}. (Attempts ${attempts})`}
				value={identifierValue}
				onChange={setIdentifierValue}
				placeholder="Your secret identifier"
				onSubmit={handleIdentifierSubmit}
				verify={handleIdentifierVerify}
				size="sm"
				loadingText="Verifying..."
			/>
		);
	}

	if (accessState === 'joining') {
		return (
			<div className="flex items-center justify-center h-screen bg-neutral-50">
				<FireLoader message="Joining session..." />
			</div>
		);
	}

	if (accessState === 'denied' || error) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-neutral-50 gap-4 px-4 dark:bg-neutral-900">
				<p className="text-neutral-700 font-medium text-center max-w-md">{error}</p>
				<FireButton
					onClick={() => router.push('/desk')}
				>
					Back to Desk
				</FireButton>
			</div>
		);
	}

	if (!session || !profile) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-neutral-50 gap-4 px-4 dark:bg-neutral-900">
				<p className="text-neutral-700 font-medium text-center max-w-md">{error}</p>
				<FireButton
					onClick={() => router.push('/desk')}
				>
					Back to Desk
				</FireButton>
			</div>
		);
	}

	return (
		<Orchestra
			session={session}
			currentUser={profile as CachedUser}
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
});

export default Room;
