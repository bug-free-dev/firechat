'use client';

import { DataSnapshot, off as rtdbOff, onValue, ref as rtdbRef } from 'firebase/database';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import RoomUI from '@/app/components/RoomUI/Orchestra';
import { FireLoader, FirePrompt } from '@/app/components/UI';
import * as messageAPI from '@/app/lib/api/messageAPI';
import * as sessionAPI from '@/app/lib/api/sessionAPI';
import { rtdb } from '@/app/lib/firebase/FireClient';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import type { FireCachedUser, SessionDoc } from '@/app/lib/types';
import { RTDBInvitedUser, RTDBParticipant, RTDBSessionMetadata } from '@/app/lib/types';
import { getAllCachedUsers, getFrequentUsers } from '@/app/lib/utils/memory';

interface RTDBSessionValue {
	metadata?: RTDBSessionMetadata;
	invited?: Record<string, RTDBInvitedUser>;
	participants?: Record<string, RTDBParticipant>;
}

type AccessState = 'checking' | 'needs_identifier' | 'joining' | 'granted' | 'denied';

export default function Room() {
	const params = useParams();
	const router = useRouter();
	const sessionId = params?.sessionId as string | undefined;

	const { profile, isLoading: profileLoading, verifyIdentifier } = useAuthState();

	const [session, setSession] = useState<SessionDoc | null>(null);
	const [profiles, setProfiles] = useState<Record<string, FireCachedUser>>({});
	const [frequentUsers, setFrequentUsers] = useState<FireCachedUser[]>([]);
	const [allUsers, setAllUsers] = useState<FireCachedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// ðŸ”’ ACCESS CONTROL STATE
	const [accessState, setAccessState] = useState<AccessState>('checking');
	const [identifierValue, setIdentifierValue] = useState('');
	const [attempts, setAttempts] = useState(0);

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

				const profilesMap: Record<string, FireCachedUser> = {};
				cached.forEach((user) => {
					profilesMap[user.uid] = user;
				});
				setProfiles(profilesMap);
			} catch {
				// Silent fail - non-critical
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [profile?.uid]);

	/* <----------- STABLE CALLBACKS (moved out of effects) -----------> */

	// Handle join errors â€” use functional updates to avoid stale attempts
	const handleJoinError = useCallback((errorCode: string) => {
		switch (errorCode) {
			case 'IDENTIFIER_REQUIRED':
				setAccessState('needs_identifier');
				toast('This session requires your secret key');
				break;

			case 'IDENTIFIER_INVALID':
				setAttempts((prev) => {
					const next = prev + 1;
					if (next >= 3) {
						toast('Are you really who you say you are ðŸ‘€?');
						setAccessState('denied');
						setError('Access denied after 3 failed attempts');
					} else {
						toast(`Incorrect key. ${3 - next} attempt${3 - next === 1 ? '' : 's'} remaining`);
						setAccessState('needs_identifier');
					}
					return next;
				});
				break;

			case 'SESSION_INACTIVE':
				setAccessState('denied');
				setError('This session has ended');
				break;

			case 'NOT_FOUND':
				setAccessState('denied');
				setError('Session not found');
				break;

			case 'USER_NOT_FOUND':
				setAccessState('denied');
				setError('Your profile could not be loaded');
				break;

			default:
				toast('Unable to join session');
				setAccessState('denied');
				setError('Access denied');
		}
	}, []);

	// Attempt to join session (stable)
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

	// Generic RTDB error handler (stable)
	const handleRTDBError = useCallback((err: unknown) => {
		const isPermissionDenied =
			typeof err === 'object' &&
			err !== null &&
			'code' in err &&
			(err as { code?: unknown }).code === 'permission-denied';

		setError(isPermissionDenied ? 'You need permission to view this session' : 'Session unavailable!');
		setAccessState('denied');
		setLoading(false);
	}, []);

	/* <----------- PHASE 1: Fetch session metadata and check access requirements -----------> */

	useEffect(() => {
		if (!sessionId || !profile?.uid || !rtdb) return;

		setLoading(true);
		setError(null);
		setAccessState('checking');

		const sessionRef = rtdbRef(rtdb, `liveSessions/${sessionId}`);

		const handleSessionUpdate = (snapshot: DataSnapshot) => {
			try {
				const val = snapshot.val() as RTDBSessionValue | null;

				// Session doesn't exist
				if (!val?.metadata) {
					setError('This session no longer exists');
					setAccessState('denied');
					setLoading(false);
					return;
				}

				const meta = val.metadata;
				const invitedUids = Object.keys(val.invited ?? {});
				const participantUids = Object.keys(val.participants ?? {});

				// Check if user has any relationship to session
				const isParticipant = participantUids.includes(profile.uid);
				const isInvited = invitedUids.includes(profile.uid);
				const isCreator = meta.creator === profile.uid;

				// Build session object
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

				// ðŸ”’ ACCESS DECISION LOGIC
				// Case 1: Already a participant or creator â†’ GRANTED
				if (isParticipant || isCreator) {
					setAccessState('granted');
					setLoading(false);
					return;
				}

				// Case 2: Invited but not participant
				if (isInvited) {
					// Check if identifier required
					if (meta.identifierRequired) {
						setAccessState('needs_identifier');
						setLoading(false);
						return;
					}

					// No identifier needed, auto-join
					setAccessState('joining');
					void attemptJoin(sessionId, undefined);
					return;
				}

				// Case 3: No relationship to session
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

	/* <----------- IDENTIFIER VERIFY / SUBMIT -----------> */

	const handleIdentifierVerify = useCallback(
		async (input: string): Promise<boolean> => {
			if (!verifyIdentifier) return false;
			try {
				const valid = await verifyIdentifier(input);
				return valid;
			} catch {
				return false;
			}
		},
		[verifyIdentifier]
	);

	const handleIdentifierSubmit = useCallback(async () => {
		if (!sessionId || !identifierValue.trim()) return;

		// Verify locally first
		const locallyValid = await handleIdentifierVerify(identifierValue);
		if (!locallyValid) {
			setAttempts((prev) => {
				const next = prev + 1;
				if (next >= 3) {
					toast('Too many failed attempts. Contact the creator for help');
					setAccessState('denied');
					setError('Access denied after 3 failed attempts');
				} else {
					toast(
						`That's not the right key. ${3 - next} attempt${3 - next === 1 ? '' : 's'} left`
					);
					setAccessState('needs_identifier');
				}
				return next;
			});
			return;
		}

		// Attempt join with verified identifier
		await attemptJoin(sessionId, identifierValue);
	}, [sessionId, identifierValue, handleIdentifierVerify, attemptJoin]);

	/* <----------- SESSION ACTION HANDLERS -----------> */

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
			if (!res.ok) {
				toast('Could not add participant');
			}
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

	// User fetch/search handlers
	const fetchFrequentUsersHandler = useCallback(async (): Promise<FireCachedUser[]> => {
		return frequentUsers;
	}, [frequentUsers]);

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

	/* <----------- RENDER STATES -----------> */

	// Loading profile or initial session check
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
				onClose={() => {
					router.push('/desk');
				}}
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

	// âŒ ACCESS DENIED
	if (accessState === 'denied' || error) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-neutral-50 gap-4 px-4">
				<p className="text-neutral-700 font-medium text-center max-w-md">{error}</p>
				<button
					onClick={() => router.push('/desk')}
					className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
				>
					Back to Desk
				</button>
			</div>
		);
	}

	if (!session || !profile) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-neutral-50 gap-4">
				<p className="text-neutral-600">Session unavailable</p>
				<button
					onClick={() => router.push('/desk')}
					className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
				>
					Back to Desk
				</button>
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
