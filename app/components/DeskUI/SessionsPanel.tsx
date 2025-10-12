'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaSearch, FaComments } from 'react-icons/fa';

import FireInput from '@/app/components/UI/FireInput';
import FirePrompt from '@/app/components/UI/FirePrompt';
import { FireCachedUser, FireProfile, InboxThread, SessionDoc } from '@/app/lib/types';
import { compare } from '@/app/lib/utils/time';

import { FloatingActionButton } from './SessionPanel/ActionButton';
import { ChatsTab } from './SessionPanel/ChatTab';
import { DecorativeIcons } from './SessionPanel/DecorativeIcons';
import { InboxTab } from './SessionPanel/InboxTab';
import InvitePicker from './SessionPanel/InvitePicker';
import { TabNavigation } from './SessionPanel/TabNavigation';
import KudosBalance from './KudosBalance';

export interface SessionsPanelProps {
	currentUser: FireProfile;
	sessions: SessionDoc[];
	invitedSessions?: SessionDoc[];
	inboxThreads: InboxThread[];
	kudosBalance: number;
	frequentUsers?: FireCachedUser[]; // use your cached type
	onCreateSession?: () => void;
	/** joinSession(sessionId, optional identifierInput) */
	onJoinSession?: (sessionId: string, identifierInput?: string) => void;
	onLeaveSession?: (sessionId: string) => void;
	onEndSession?: (sessionId: string) => void;
	onLockSession?: (sessionId: string) => void;
	onOpenInbox?: (threadId: string) => void;
	loading?: boolean;

	// invite: sessionId + list of user objects (friendly)
	onInviteToUsers?: (sessionId: string, users: FireCachedUser[]) => Promise<void>;
	verifyIdentifier?: (input: string) => Promise<boolean>;
}

type TabType = 'chats' | 'inbox';

export default function SessionsPanel({
	currentUser,
	sessions = [],
	inboxThreads = [],
	kudosBalance,
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
}: SessionsPanelProps) {
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

	// handle confirm from InvitePicker
	const handleInviteConfirm = async (users: FireCachedUser[]) => {
		if (!inviteForSession) return;
		const sid = inviteForSession.id || '';
		try {
			if (onInviteToUsers) {
				await onInviteToUsers(sid, users);
			} else {
				// fallback: copy link to clipboard
				const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${sid}`;
				try {
					await navigator.clipboard.writeText(link);
				} catch {
					/** Ignore */
				}
			}
		} catch {
		} finally {
			setInviteForSession(null);
		}
	};

	// join flow: if identifier required, open prompt; otherwise call onJoinSession
	const handleJoinAttempt = (session: SessionDoc) => {
		if (!session) return;
		if (session.identifierRequired) {
			setPromptForSession(session);
			setPromptValue('');
			return;
		}
		onJoinSession?.(session.id || '');
	};

	// verify submit
	const handleVerifySubmit = async () => {
		const session = promptForSession;
		if (!session) return;
		const sid = session.id || '';
		const attempts = attemptsMap[sid] || 0;

		if (!verifyIdentifier) {
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
				toast('Are you really who you say you are? 🤨');
				setPromptForSession(null);
				setPromptValue('');
				return;
			}

			const remaining = 3 - next;
			toast.error(`Wrong identifier — ${remaining} attempt(s) left`);
		} catch {}
	};

	return (
		<div className="relative w-full min-h-screen bg-gradient-to-br from-white via-orange-50/10 to-white px-4 sm:px-6 py-8 overflow-hidden">
			<DecorativeIcons />

			<div className="max-w-5xl mx-auto relative z-10">
				{/* Header with Kudos Balance */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
					<div>
						<h1 className="font-dyna text-4xl font-bold text-neutral-800 flex items-center gap-3 justify-center text-center">
							<FaComments className="text-lime-400" />
							Sessions
						</h1>
						<p className="font-righteous text-sm text-neutral-500 mt-1 text-center">
							Where sparks turn into bonfires
						</p>
					</div>

					{/* Kudos Badge */}
					<KudosBalance kudosBalance={kudosBalance} />
				</div>

				{/* Tab Navigation */}
				<TabNavigation
					activeTab={activeTab}
					onTabChange={setActiveTab}
					activeSessions={filteredSessions.filter((s) => s.isActive).length}
					unreadInbox={inboxThreads.filter((t) => (t.unreadCount || 0) > 0).length}
				/>

				{/* Search Bar */}
				<div className="mb-6">
					<div className="relative">
						<FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
						<FireInput
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder={
								activeTab === 'chats' ? 'Search sessions...' : 'Search conversations...'
							}
							className="pl-10"
						/>
					</div>
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
							onJoinSession={(sid) => {
								const s = sessions.find((x) => x.id === sid);
								if (s) handleJoinAttempt(s);
								else onJoinSession?.(sid);
							}}
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
					}}
					header={`Enter identifier for ${promptForSession.title ?? 'session'}`}
					value={promptValue}
					onChange={setPromptValue}
					placeholder="Your secret identifier"
					onSubmit={handleVerifySubmit}
					verify={verifyIdentifier}
					size="md"
				/>
			)}
		</div>
	);
}
