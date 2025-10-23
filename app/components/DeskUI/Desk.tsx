'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { FireButton, FireHeader, FireInput, FireSlide, FireToast } from '@/app/components/UI';
import { FirePicker as InvitePicker } from '@/app/components/UI';
import * as sessionAPI from '@/app/lib/api/sessionAPI';
import { useFireInbox } from '@/app/lib/hooks/useFireInbox';
import { useKudos } from '@/app/lib/hooks/useFireKudos';
import { useFireSession } from '@/app/lib/hooks/useFireSession';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import type { FireCachedUser, FireProfile, SessionDoc } from '@/app/lib/types';
import { getAllCachedUsers, getFrequentUsers } from '@/app/lib/utils/memory';

import { NavTabs } from './NavTab';
import { KudosPanel, ProfilePanel, SessionsPanel } from './Panels';

const TAB_ORDER = ['profile', 'kudos', 'sessions'] as const;
type TabType = (typeof TAB_ORDER)[number];

export default function Desk() {
	const router = useRouter();

	const { profile, updateProfile, verifyIdentifier } = useAuthState();

	const [activeTab, setActiveTab] = useState<TabType>('profile');

	// Swipe tracking
	const touchStartX = useRef<number | null>(null);
	const touchEndX = useRef<number | null>(null);
	const touchStartY = useRef<number | null>(null);
	const touchEndY = useRef<number | null>(null);
	const SWIPE_THRESHOLD = 50; // horizontal distance required
	const VERTICAL_THRESHOLD = 30; // vertical tolerance

	// Kudos
	const kudosHook = useKudos({ currentUser: profile ?? null });

	const services = useMemo(
		() => ({
			getUserSessionsAndInvites: sessionAPI.getUserSessionsAndInvites,
			createSession: sessionAPI.createSession,
			joinSession: sessionAPI.joinSession,
			leaveSession: sessionAPI.leaveSession,
			endSession: sessionAPI.endSession,
			toggleLockSession: sessionAPI.toggleLockSession,
			updateSessionMetadata: sessionAPI.updateSessionMetadata,
		}),
		[]
	);

	// Session manager
	const sessionManager = useFireSession({
		userUid: profile?.uid ?? null,
		services,
		enableRealtime: true,
		pollingInterval: 50000,
		autoRefresh: true,
	});

	// Inbox
	const inbox = useFireInbox(profile?.uid ?? null);

	// Users for InvitePicker
	const [allUsers, setAllUsers] = useState<FireCachedUser[]>([]);
	const [frequentUsers, setFrequentUsers] = useState<FireCachedUser[]>([]);
	const loadedForUidRef = useRef<string | null>(null);

	useEffect(() => {
		const uid = profile?.uid;
		if (!uid || loadedForUidRef.current === uid) return;
		let cancelled = false;

		void (async () => {
			try {
				const [cached, freq] = await Promise.all([
					getAllCachedUsers(),
					getFrequentUsers(uid, 10),
				]);
				if (!cancelled) {
					setAllUsers(cached);
					setFrequentUsers(freq);
					loadedForUidRef.current = uid;
				}
			} catch {
				toast.error("Couldn't load users. Please refresh the page.");
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [profile?.uid]);

	// Create session UI state
	const [createOpen, setCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [title, setTitle] = useState('');
	const [identifierRequired, setIdentifierRequired] = useState(false);
	const [createInviteOpen, setCreateInviteOpen] = useState(false);
	const [createInvited, setCreateInvited] = useState<FireCachedUser[]>([]);

	/* ---------------------- SWIPE HANDLERS ---------------------- */
	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.changedTouches[0].clientX;
		touchStartY.current = e.changedTouches[0].clientY;
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		touchEndX.current = e.changedTouches[0].clientX;
		touchEndY.current = e.changedTouches[0].clientY;
		handleSwipe();
	};

	const handleSwipe = () => {
		if (
			touchStartX.current === null ||
			touchEndX.current === null ||
			touchStartY.current === null ||
			touchEndY.current === null
		)
			return;

		const deltaX = touchEndX.current - touchStartX.current;
		const deltaY = touchEndY.current - touchStartY.current;

		// Ignore swipe if vertical movement is too big
		if (Math.abs(deltaY) > VERTICAL_THRESHOLD) return;

		const currentIndex = TAB_ORDER.indexOf(activeTab);

		if (deltaX > SWIPE_THRESHOLD && currentIndex > 0) {
			// swipe right -> previous tab
			setActiveTab(TAB_ORDER[currentIndex - 1]);
		} else if (deltaX < -SWIPE_THRESHOLD && currentIndex < TAB_ORDER.length - 1) {
			// swipe left -> next tab
			setActiveTab(TAB_ORDER[currentIndex + 1]);
		}

		touchStartX.current = null;
		touchEndX.current = null;
		touchStartY.current = null;
		touchEndY.current = null;
	};
	const handleCreateClick = () => {
		setTitle('');
		setIdentifierRequired(false);
		setCreateInvited([]);
		setCreateOpen(true);
	};

	const handleCreateSubmit = async () => {
		if (!profile?.uid) return;
		setCreating(true);
		try {
			const invitedUids = createInvited.map((u) => u.uid);
			const res = await sessionManager.createSession({
				title: title || '',
				invited: invitedUids,
				identifierRequired,
				meta: {},
				cost: 10,
			});
			if (!res.ok) {
				toast.error("Oops! Couldn't create the session. Please try again.");
				return;
			}
			toast.success('Your session is ready!');
			setCreateOpen(false);
		} catch {
			toast.error(
				"Oops! Couldn't create the session. Please check your kudos balance and try again."
			);
		} finally {
			setCreating(false);
		}
	};

	// Session actions
	const onJoinSession = async (sessionId: string, identifierInput?: string) => {
		try {
			const res = await sessionManager.joinSession({
				sessionId,
				identifierInput,
			});
			if (!res.ok) {
				toast.error('Joining failed. Please try again later.');
				return;
			}
			const id = res.data?.id ?? sessionId;
			router.push(`/room/${id}`);
		} catch {
			toast.error("Couldn't join the session. Please check your details and try again.");
		}
	};

	const onLeaveSession = async (sessionId: string) => {
		try {
			const res = await sessionManager.leaveSession(sessionId);
			if (!res.ok) {
				toast.error("Couldn't leave the session. Please try again.");
				return;
			}
			toast.success('You have left the session successfully.');
		} catch {
			toast.error("Couldn't leave the session. Please try again.");
		}
	};

	const onEndSession = async (sessionId: string) => {
		FireToast({
			title: 'End Session',
			message: 'If you end the session, all chat history will be lost. End it?',
			actions: [
				{ label: 'Cancel', variant: 'secondary', onClick: () => {} },
				{
					label: 'End',
					variant: 'danger',
					onClick: async () => {
						try {
							const res = await sessionManager.endSession(sessionId);
							if (!res.ok) {
								toast.error("Couldn't end the session. Please try again.");
								return;
							}
							toast.success('The session has been ended successfully.');
						} catch {
							toast.error("Couldn't end the session. Please try again.");
						}
					},
				},
			],
		});
	};

	const onLockSession = async (sessionId: string) => {
		const session = sessionManager.sessions.find((s) => s.id === sessionId);
		if (!session) return;
		try {
			const res = await sessionManager.toggleLock(sessionId, !session.isLocked);
			if (!res.ok) {
				toast.error("Couldn't update the session lock. Please try again.");
				return;
			}
			toast.success(
				session.isLocked ? 'The session is now unlocked.' : 'The session is now locked.'
			);
		} catch {
			toast.error("Couldn't update the session lock. Please try again.");
		}
	};

	// Inbox actions
	const handleOpenInbox = async (threadId: string): Promise<void> => {
		try {
			await inbox.markRead(threadId);
		} catch {}

		const thread = inbox.threads.find((t) => t.id === threadId);
		if (!thread) {
			toast.error('Could not open the thread');
			return;
		}
	};

	const handleInviteToUsers = async (
		sessionId: string,
		users: FireCachedUser[]
	): Promise<void> => {
		if (!profile?.uid) {
			toast.error('Not authenticated');
			return;
		}
		if (!sessionId?.trim()) {
			toast.error('Invalid session');
			return;
		}
		if (!users || users.length === 0) {
			toast.error('No contacts selected');
			return;
		}

		const toUids = users.map((u) => u.uid).filter(Boolean);
		if (toUids.length === 0) {
			toast.error('No valid contacts');
			return;
		}

		try {
			const session = sessionManager.sessions.find((s) => s.id === sessionId);
			const sessionTitle = session?.title || 'Untitled Session';

			// Enterprise atomic invite operation
			const res = await sessionAPI.inviteUsersToSession({
				sessionId,
				toUids,
				fromUid: profile.uid,
				sessionTitle,
				customMessage: `${profile.displayName} invited you to join "${sessionTitle}" 🔥`,
			});

			if (!res.ok) {
				// Type-safe error handling
				if (res.error === 'SESSION_NOT_FOUND') {
					toast.error('Session no longer exists');
				} else if (res.error === 'SESSION_INACTIVE') {
					toast.error('Session has ended');
				} else if (res.error === 'NO_VALID_USERS') {
					toast.error(res.reason || 'All users already invited or are participants');
				} else if (res.error === 'NO_RECIPIENTS') {
					toast.error('No valid recipients');
				} else {
					toast.error(res.reason || `Failed to invite: ${res.error}`);
				}
				return;
			}

			// Type-safe success response
			const { invitedCount, skippedCount } = res.data;
			const message =
				skippedCount > 0
					? `Invited ${invitedCount} user${invitedCount !== 1 ? 's' : ''} (${skippedCount} already invited or participant${skippedCount !== 1 ? 's' : ''})`
					: `Invited ${invitedCount} user${invitedCount !== 1 ? 's' : ''}! They'll see it in their sessions.`;

			toast(message);

			await sessionManager.refresh();
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Invitation failed';
			toast.error(errorMsg);
		}
	};

	// Verify identifier wrapper
	const verifyIdentifierWrapper = async (input: string): Promise<boolean> => {
		try {
			return await verifyIdentifier(input);
		} catch {
			return false;
		}
	};

	// Profile update handler
	const handleProfileUpdate = async (updates: Partial<FireProfile>): Promise<void> => {
		if (!profile?.uid) return;
		try {
			const success = await updateProfile(updates);
			if (success) toast.success('Profile updated');
			else toast.error('Failed to update profile');
		} catch {
			toast.error('Network error');
		}
	};

	// Kudos handler
	const handleSendKudos = async (
		_fromUid: string,
		toUid: string,
		amount: number,
		note?: string
	): Promise<{ success: boolean; reason?: string }> => {
		if (!profile?.uid) return { success: false, reason: 'Not authenticated' };
		const result = await kudosHook.sendKudos(toUid, amount, note);
		return result;
	};

	// Render active panel
	const renderActivePanel = (): React.ReactNode => {
		if (!profile) return null;

		switch (activeTab) {
			case 'profile':
				return <ProfilePanel profile={profile} onUpdate={handleProfileUpdate} />;
			case 'kudos':
				return (
					<KudosPanel
						currentUser={profile}
						transactions={kudosHook.transactions}
						allUsers={allUsers}
						onSendKudos={handleSendKudos}
						recentLimit={15}
					/>
				);
			case 'sessions':
				return (
					<SessionsPanel
						currentUser={profile}
						sessions={sessionManager.sessions}
						inboxThreads={inbox.threads}
						invitedSessions={sessionManager.invitedSessions}
						frequentUsers={frequentUsers}
						onCreateSession={handleCreateClick}
						onJoinSession={(sid: string, identifier?: string) =>
							void onJoinSession(sid, identifier)
						}
						onLeaveSession={(sid) => void onLeaveSession(sid)}
						onEndSession={(sid) => void onEndSession(sid)}
						onLockSession={(sid) => void onLockSession(sid)}
						onOpenInbox={(tid) => void handleOpenInbox(tid)}
						loading={sessionManager.loading || inbox.loading}
						onInviteToUsers={async (sid, users) => await handleInviteToUsers(sid, users)}
						verifyIdentifier={verifyIdentifierWrapper}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className="flex flex-col min-h-screen bg-neutral-50"
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
		>
			<FireHeader />
			<main className="flex-1 pb-24">{renderActivePanel()}</main>
			<NavTabs activeTab={activeTab} onTabChange={setActiveTab} />

			{/* Create Session Slide */}
			<FireSlide
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				size="md"
				header="Spark a chat"
				footer={
					<div className="flex gap-3 justify-end">
						<FireButton variant="secondary" onClick={() => setCreateOpen(false)}>
							Cancel
						</FireButton>
						<FireButton
							onClick={handleCreateSubmit}
							disabled={creating}
							variant="default"
							loading={creating}
						>
							{creating ? 'Creating...' : 'Create'}
						</FireButton>
					</div>
				}
			>
				<div className="space-y-4">
					<div>
						<label className="text-sm text-neutral-600 block mb-1">Title</label>
						<FireInput
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Session name (optional)"
						/>
					</div>
					<div className="flex items-center gap-2">
						<input
							id="identifierRequired"
							type="checkbox"
							checked={identifierRequired}
							onChange={(e) => setIdentifierRequired(e.target.checked)}
							className="w-4 h-4"
						/>
						<label htmlFor="identifierRequired" className="text-sm text-neutral-700">
							Do you want them to join with their identifier key?
						</label>
					</div>

					<div>
						<label className="text-sm text-neutral-600 block mb-1">Invite contacts</label>
						<div className="flex gap-2 items-center">
							<div className="flex-1">
								{createInvited.length === 0 ? (
									<div className="text-xs text-neutral-500 mt-2">
										No contacts chosen yet — pick from Frequent or search.
									</div>
								) : (
									<div className="text-xs text-neutral-700 mt-2">
										{createInvited.length} contact(s) selected
									</div>
								)}
							</div>

							<button
								onClick={() => setCreateInviteOpen(true)}
								className="py-2 px-3 rounded-lg bg-indigo-100 text-indigo-700 font-medium hover:bg-indigo-200 transition"
							>
								Pick contacts
							</button>
						</div>
					</div>
				</div>
			</FireSlide>

			{/* InvitePicker */}
			<InvitePicker
				open={createInviteOpen}
				onClose={() => setCreateInviteOpen(false)}
				frequentUsers={frequentUsers}
				session={
					{
						id: 'create-temp',
						creator: profile?.uid ?? 'unknown',
						participants: [],
						isActive: true,
						isLocked: false,
						identifierRequired,
						createdAt: new Date().toISOString(),
						meta: {},
					} as SessionDoc
				}
				onConfirm={(users) => {
					setCreateInvited((prev) => {
						const map = new Map(prev.map((u) => [u.uid, u]));
						for (const u of users) map.set(u.uid, u);
						return Array.from(map.values()).slice(0, 50);
					});
					setCreateInviteOpen(false);
					toast.success(`Added ${users.length} contact(s)`);
				}}
			/>
		</div>
	);
}
