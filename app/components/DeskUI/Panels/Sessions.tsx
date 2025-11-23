'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaInbox } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { IoChatbubblesOutline } from 'react-icons/io5';

import {
	FireInput,
	FirePicker as InvitePicker,
	FirePrompt,
	FireTabSwitcher,
} from '@/app/components/UI';
import { CachedUser, FireProfile, InboxThread, SessionDoc } from '@/app/lib/types';
import { compare } from '@/app/lib/utils/time';

import { ChatsTab, FloatingActionButton, InboxTab } from '../SessionsUI';

export interface SessionsPanelProps {
	currentUser: FireProfile;
	sessions: SessionDoc[];
	invitedSessions?: SessionDoc[];
	inboxThreads: InboxThread[];
	frequentUsers?: CachedUser[];
	onCreateSession?: () => void;
	onJoinSession?: (sessionId: string, identifierInput?: string) => void;
	onLeaveSession?: (sessionId: string) => void;
	onEndSession?: (sessionId: string) => void;
	onLockSession?: (sessionId: string) => void;
	onOpenInbox?: (threadId: string) => void;
	loading?: boolean;
	onInviteToUsers?: (sessionId: string, users: CachedUser[]) => Promise<void>;
	verifyIdentifier?: (input: string) => Promise<boolean>;
}

type TabType = 'chats' | 'inbox';

export const SessionsPanel: React.FC<SessionsPanelProps> = ({
	currentUser,
	sessions = [],
	inboxThreads = [],
	frequentUsers = [],
	onCreateSession,
	onJoinSession,
	onLeaveSession,
	onEndSession,
	onLockSession,
	invitedSessions = [],
	onOpenInbox,
	loading = false,
	onInviteToUsers,
	verifyIdentifier,
}) => {
	const [activeTab, setActiveTab] = useState<TabType>('chats');
	const [searchQuery, setSearchQuery] = useState('');
	const [inviteForSession, setInviteForSession] = useState<SessionDoc | null>(null);
	const [promptForSession, setPromptForSession] = useState<SessionDoc | null>(null);
	const [promptValue, setPromptValue] = useState('');
	const [attemptsMap, setAttemptsMap] = useState<Record<string, number>>({});

	// Filter sessions
	const filteredSessions = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		let filtered = sessions;
		if (q) {
			filtered = sessions.filter(
				(s) =>
					(s.creator ?? '').toLowerCase().includes(q) ||
					(s.participants ?? []).some((p) => (p ?? '').toLowerCase().includes(q))
			);
		}
		return filtered.sort((a, b) => {
			if (a.isActive === b.isActive) {
				return compare.desc(a.createdAt, b.createdAt);
			}
			return a.isActive ? -1 : 1;
		});
	}, [sessions, searchQuery]);

	// Filter inbox threads
	const filteredInbox = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return inboxThreads;
		return inboxThreads.filter((thread) =>
			thread.participants.some((p) => p.toLowerCase().includes(q))
		);
	}, [inboxThreads, searchQuery]);

	const isCreator = (session: SessionDoc) => session.creator === currentUser.uid;
	const isParticipant = (session: SessionDoc) =>
		(session.participants ?? []).includes(currentUser.uid);

	// open invite picker
	const openInvitePicker = (session: SessionDoc) => {
		setInviteForSession(session);
	};

	const handleInviteConfirm = async (users: CachedUser[]) => {
		if (!inviteForSession) return;
		const sid = inviteForSession.id || '';
		const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${sid}`;

		try {
			if (onInviteToUsers) {
				await onInviteToUsers(sid, users);
			}

			await navigator.clipboard.writeText(link);
			toast.success('Room link copied!');
		} catch {
			/** Parent handles the error */
		} finally {
			setInviteForSession(null);
		}
	};
	// In SessionsPanel.tsx - handleJoinAttempt
	const handleJoinAttempt = (sessionId: string) => {
		// Check if this session requires identifier
		const invitedSession = invitedSessions.find((s) => s.id === sessionId);
		const participantSession = sessions.find((s) => s.id === sessionId);

		const session = invitedSession || participantSession;

		// The server will handle the identifier check
		if (!session) {
			onJoinSession?.(sessionId);
			return;
		}

		// If identifier required, show prompt
		if (session.identifierRequired) {
			setPromptForSession(session);
			setPromptValue('');
			return;
		}

		onJoinSession?.(sessionId);
	};

	// verify submit
	const handleVerifySubmit = async () => {
		const session = promptForSession;
		if (!session) return;
		const sid = session.id || '';
		const attempts = attemptsMap[sid] || 0;

		if (!verifyIdentifier) {
			onJoinSession?.(sid, promptValue);
			setPromptForSession(null);
			setPromptValue('');
			return;
		}

		try {
			const ok = await verifyIdentifier(promptValue);

			if (ok) {
				setPromptForSession(null);
				setPromptValue('');
				onJoinSession?.(sid, promptValue);
				setAttemptsMap((m) => {
					const copy = { ...m };
					delete copy[sid];
					return copy;
				});
				return;
			}

			// invalid
			const next = attempts + 1;
			setAttemptsMap((m) => ({ ...m, [sid]: next }));

			if (next >= 3) {
				toast.error('3 failed attempts — contact the creator for help');
				toast('Are you really who you say you are?');
				setPromptForSession(null);
				setPromptValue('');
				return;
			}

			const remaining = 3 - next;
			toast.error(`Wrong identifier — ${remaining} attempt(s) left`);
		} catch {
			toast.error('Verification error. Please try again.');
		}
	};

	return (
		<div className="relative w-full min-h-screen bg-white dark:bg-neutral-900 px-4 sm:px-6 py-8 overflow-hidden">
			<div className="max-w-5xl mx-auto relative z-10">
				{/* Header with Kudos Balance */}
				<div className="flex flex-col items-center justify-between gap-4 mb-6 text-center">
					<div>
						<h1 className="font-bubblegum text-3xl text-neutral-800 dark:text-lime-100 flex items-center gap-3 justify-center ">
							<IoChatbubblesOutline className="text-lime-500" />
							Sessions
						</h1>
						<p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 text-center">
							Start your conversation now!
						</p>
					</div>

					{/* Kudos Badge */}
				</div>

				{/* Tab Navigation */}
				<FireTabSwitcher
					activeTab={activeTab}
					onTabChange={setActiveTab}
					tabs={[
						{
							id: 'chats',
							label: 'Chats',
							icon: <IoChatbubblesOutline className="w-4.5 h-4.5" />,
							count: filteredSessions.filter((s) => s.isActive).length,
							tooltip: 'Where sparks turn into bonfires',
						},
						{
							id: 'inbox',
							label: 'Inbox',
							icon: <FaInbox className="w-4 h-4" />,
							count: inboxThreads.filter((t) => (t.unreadCount || 0) > 0).length,
							tooltip: 'Private whispers, just for you',
						},
					]}
					className="mb-6"
				/>

				{/* Search Bar */}
				<div className="flex items-center gap-2 mb-4">
					<FiSearch className="text-neutral-500 dark:text-neutral-400 w-4 h-4 m-1" />
					<FireInput
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={
							activeTab === 'chats' ? 'Search sessions...' : 'Search conversations...'
						}
						className="pl-5"
					/>
				</div>

				{/* Tab Content */}
				<div className="min-h-[400px]">
					{activeTab === 'chats' ? (
						<ChatsTab
							sessions={filteredSessions}
							currentUser={currentUser}
							frequentUsers={frequentUsers || []}
							isCreator={isCreator}
							invitedSessions={invitedSessions}
							isParticipant={isParticipant}
							onCreateSession={onCreateSession}
							onInvite={(s) => openInvitePicker(s)}
							onJoinSession={handleJoinAttempt}
							onLeaveSession={onLeaveSession}
							onEndSession={onEndSession}
							onLockSession={onLockSession}
							loading={loading}
						/>
					) : (
						<InboxTab
							threads={filteredInbox}
							currentUser={currentUser}
							onOpenInbox={onOpenInbox}
							loading={loading}
						/>
					)}
				</div>
			</div>

			{/* Floating Action Button */}
			{onCreateSession && activeTab === 'chats' && (
				<FloatingActionButton onClick={onCreateSession} />
			)}

			{/* InvitePicker */}
			{inviteForSession && (
				<InvitePicker
					open={!!inviteForSession}
					onClose={() => setInviteForSession(null)}
					frequentUsers={frequentUsers || []}
					session={inviteForSession}
					onConfirm={handleInviteConfirm}
				/>
			)}

			{/* Identifier prompt (FirePrompt) */}
			{promptForSession && (
				<FirePrompt
					open={!!promptForSession}
					onClose={() => {
						setPromptForSession(null);
						setPromptValue('');
						setAttemptsMap((m) => {
							const copy = { ...m };
							delete copy[promptForSession.id || ''];
							return copy;
						});
					}}
					header={`Enter identifier for ${promptForSession.title ?? 'session'}`}
					value={promptValue}
					onChange={setPromptValue}
					placeholder="Your secret identifier"
					onSubmit={handleVerifySubmit}
					size="md"
				/>
			)}
		</div>
	);
};
