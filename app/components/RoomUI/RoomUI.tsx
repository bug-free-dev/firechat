'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiMessageCircle, FiUsers } from 'react-icons/fi';

import { MessagesServices, useFireMessages } from '@/app/lib/hooks/useFireMessages';
import { ChatMessage, FireCachedUser, SessionDoc } from '@/app/lib/types';
import { toMillis } from '@/app/lib/utils/time';

import FireHeader from '../UI/FireHeader';
import { FireToast } from '../UI/FireToast';
import MessageComposer from './MessageComposer';
import MessageList from './MessageList';
import ParticipantsPanel from './ParticipantsPanel';
import ParticipantPicker from './ParticipantsPicker';
import SessionHeader from './SessionHeader';
import TypingIndicator from './TypingIndicator';

export interface RoomUIProps {
	session: SessionDoc;
	currentUser: FireCachedUser;
	profiles?: Record<string, FireCachedUser>;

	// Message services (injected)
	messageServices: MessagesServices;

	// Session actions
	onLeaveSession?: (sessionId: string, userId: string) => Promise<void>;
	onEndSession?: (sessionId: string) => Promise<void>;
	onAddParticipant?: (sessionId: string, userId: string) => Promise<void>;
	onToggleLock?: (sessionId: string, locked: boolean) => Promise<void>;
	onUpdateMetadata?: (sessionId: string, updates: { title?: string }) => Promise<void>;

	fetchFrequentUsers?: (forUid: string) => Promise<FireCachedUser[]>;
	searchUsers?: (query: string) => Promise<FireCachedUser[]>;
}

const RoomUI: React.FC<RoomUIProps> = ({
	session,
	currentUser,
	profiles = {},
	messageServices,
	onLeaveSession,
	onEndSession,
	onAddParticipant,
	onToggleLock,
	onUpdateMetadata,
	fetchFrequentUsers,
	searchUsers,
}) => {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<'chats' | 'participants'>('chats');
	const [replyingTo, setReplyingTo] = useState<ChatMessage | undefined>();
	const [inviteOpen, setInviteOpen] = useState(false);
	const [frequentUsers, setFrequentUsers] = useState<FireCachedUser[]>([]);

	useEffect(() => {
		let mounted = true;
		if (!fetchFrequentUsers) return void setFrequentUsers([]);

		void (async () => {
			try {
				const out = await fetchFrequentUsers(currentUser.uid);
				if (mounted) setFrequentUsers(out.slice(0, 10));
			} catch {}
		})();

		return () => {
			mounted = false;
		};
	}, [fetchFrequentUsers, currentUser.uid]);

	// Initialize messages manager
	const {
		messages,
		sending,
		typingUsers,
		setTyping,
		sendMessage: sendMsg,
		addReaction: addReact,
		removeReaction: removeReact,
		deleteMessage,
	} = useFireMessages({
		sessionId: session.id!,
		userUid: currentUser.uid,
		services: messageServices,
		options: {
			initialLimit: 50,
			liveLimit: 100,
			maxMessagesInMemory: 500,
			typingProfile: {
				uid: currentUser.uid,
				displayName: currentUser.displayName,
				avatarUrl: currentUser.avatarUrl,
			},
			typingDebounceMs: 1200,
		},
	});

	const safeMessages = useMemo(() => {
		if (!Array.isArray(messages)) return [];
		return [...messages].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
	}, [messages]);

	/* ==================== HANDLERS ==================== */

	const handleSend = useCallback(
		async (text: string, replyToId?: string) => {
			try {
				const res = await sendMsg(text, replyToId);
				if (!res.ok) {
					toast.error(`Failed to send: ${res.error}`);
					return;
				}
				setReplyingTo(undefined);
			} catch {
				toast.error('Failed to send message');
			}
		},
		[sendMsg]
	);

	const handleDelete = useCallback(
		async (messageId?: string) => {
			if (!messageId) {
				toast.error('Invalid Message');
				return;
			}
			try {
				const res = await deleteMessage(messageId);
				if (!res.ok) {
					toast.error(`Failed to send: ${res.error}`);
					return;
				}
			} catch {
				toast.error('Failed to send message');
			}
		},
		[deleteMessage]
	);

	const handleToggleReaction = useCallback(
		async (messageId: string, emoji: string) => {
			const message = safeMessages.find((m) => m.id === messageId);
			if (!message) return toast.error('Message not found');

			const hasReacted = !!message.reactions?.[emoji]?.includes(currentUser.uid);

			try {
				const res = hasReacted
					? await removeReact(messageId, emoji)
					: await addReact(messageId, emoji);

				if (!res.ok) {
					toast.error(`Failed to ${hasReacted ? 'remove' : 'add'} reaction`);
				}
			} catch {
				toast.error('Failed to update reaction');
			}
		},
		[safeMessages, currentUser.uid, addReact, removeReact]
	);

	const handleEndSession = useCallback(async () => {
		if (!onEndSession || !session.id) {
			return toast.error('End session not configured');
		}

		FireToast({
			title: 'End Session',
			message: 'Are you sure you want to end this session? This action cannot be undone.',
			actions: [
				{
					label: 'Cancel',
					variant: 'secondary',
					onClick: () => {},
				},
				{
					label: 'End',
					variant: 'danger',
					onClick: async () => {
						try {
							await onEndSession(session.id!);
							router.push('/desk');
						} catch {
							/** Ignore, parent manages */
						}
					},
				},
			],
		});
	}, [onEndSession, session.id, router]);

	const handleLeaveSession = useCallback(async () => {
		if (!onLeaveSession || !session.id) {
			return toast.error('Leave session not configured');
		}

		FireToast({
			title: 'Leave Session',
			message: 'Are you sure you want to leave this session?',
			actions: [
				{
					label: 'Cancel',
					variant: 'secondary',
					onClick: () => {},
				},
				{
					label: 'Leave',
					variant: 'secondary',
					onClick: async () => {
						try {
							await onLeaveSession(session.id!, currentUser.uid);
							router.push('/desk');
						} catch {
							toast.error('Failed to leave session');
						}
					},
				},
			],
		});
	}, [onLeaveSession, session.id, currentUser.uid, router]);

	const handleAddParticipant = useCallback(
		async (uid: string) => {
			if (!onAddParticipant || !session.id) {
				return toast.error('Add participant not configured');
			}

			try {
				await onAddParticipant(session.id, uid);
			} catch {
				toast.error('Failed to add participant');
			}
		},
		[onAddParticipant, session.id]
	);

	const handleToggleLock = useCallback(
		async (locked: boolean) => {
			if (!onToggleLock || !session.id) {
				return toast.error('Toggle lock not configured');
			}

			try {
				await onToggleLock(session.id, locked);
			} catch {
				toast.error('Failed to update lock');
			}
		},
		[onToggleLock, session.id]
	);

	const handleUpdateMetadata = useCallback(
		async (updates: { title?: string }) => {
			if (!onUpdateMetadata || !session.id) {
				return;
			}

			try {
				await onUpdateMetadata(session.id, updates);
			} catch {
				toast.error('Failed to update session');
			}
		},
		[onUpdateMetadata, session.id]
	);

	const onPickerConfirm = useCallback(
		async (users: FireCachedUser[]) => {
			if (!users || users.length === 0) return;
			for (const u of users) {
				await handleAddParticipant(u.uid);
			}
		},
		[handleAddParticipant]
	);

	return (
		<div className="flex flex-col h-screen bg-neutral-50">
			{/* Top header */}
			<div className="border-b border-neutral-200 bg-white">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-1 sm:py-2">
					<FireHeader showSubtitle={false} size="sm" variant="minimal" />
				</div>
			</div>

			{/* Session header */}
			<SessionHeader
				session={session}
				participantCount={session.participants?.length ?? 0}
				onEndSession={handleEndSession}
				onOpenInvite={() => setInviteOpen(true)}
				onToggleLock={handleToggleLock}
				onLeaveSession={handleLeaveSession}
				onUpdateMetadata={handleUpdateMetadata}
				userUid={currentUser.uid}
			/>

			{/* Tabs */}
			<div className="border-b border-neutral-300 bg-white">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
					<div className="flex gap-6">
						<button
							onClick={() => setActiveTab('chats')}
							className={`py-3 sm:py-4 text-sm font-medium relative flex items-center gap-2 transition-all duration-300 ${
								activeTab === 'chats'
									? 'text-neutral-900 scale-105'
									: 'text-neutral-500 hover:text-neutral-700 hover:scale-102'
							}`}
						>
							<FiMessageCircle
								className={`transition-transform duration-300 ${
									activeTab === 'chats' ? 'rotate-12 scale-110' : ''
								}`}
							/>
							Chats
							{activeTab === 'chats' && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 animate-pulse" />
							)}
						</button>

						<button
							onClick={() => setActiveTab('participants')}
							className={`py-3 sm:py-4 text-sm font-medium relative flex items-center gap-2 transition-all duration-300 ${
								activeTab === 'participants'
									? 'text-neutral-900 scale-105'
									: 'text-neutral-500 hover:text-neutral-700 hover:scale-102'
							}`}
						>
							<FiUsers
								className={`transition-transform duration-300 ${
									activeTab === 'participants' ? 'rotate-12 scale-110' : ''
								}`}
							/>
							Participants
							{activeTab === 'participants' && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 animate-pulse" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Content area */}
			<div className="flex-1 overflow-hidden bg-white">
				{activeTab === 'chats' ? (
					<div className="scroll h-full overflow-y-auto pb-24 sm:pb-28">
						<MessageList
							messages={safeMessages}
							currentUserUid={currentUser.uid}
							profiles={profiles}
							onReply={(m) => setReplyingTo(m)}
							onToggleReaction={(id, emoji) => void handleToggleReaction(id, emoji)}
							onCopyMessage={(id) => toast.success(`Message ${id} copied`)}
							onDeleteMessage={(id) => handleDelete(id)}
						/>

						{/* Super Funky Cartoonistic Typing Indicator */}
						<TypingIndicator typingUsers={typingUsers} />
					</div>
				) : (
					<div className="scroll h-full overflow-y-auto pb-24 sm:pb-28">
						<ParticipantsPanel
							participants={session.participants}
							profiles={profiles}
							currentUserUid={currentUser.uid}
							onOpenInvite={() => setInviteOpen(true)}
						/>
					</div>
				)}
			</div>

			{/* Fixed composer */}
			{activeTab === 'chats' && (
				<div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-neutral-200">
					<div className="mx-auto px-0 lg:px-80 pb-safe">
						<MessageComposer
							onSend={handleSend}
							disabled={!session.isActive || sending}
							replyingTo={replyingTo}
							replyToSender={replyingTo ? profiles[replyingTo.sender] : undefined}
							onCancelReply={() => setReplyingTo(undefined)}
							onTyping={setTyping}
						/>
					</div>
				</div>
			)}

			{/* Participant picker modal */}
			<ParticipantPicker
				open={inviteOpen}
				onClose={() => setInviteOpen(false)}
				session={session}
				currentParticipants={session?.participants ?? []}
				frequentUsers={frequentUsers}
				searchUsers={searchUsers}
				onConfirm={onPickerConfirm}
			/>
		</div>
	);
};

export default RoomUI;
