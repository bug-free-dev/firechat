'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiMessageCircle, FiUsers } from 'react-icons/fi';

import { useFireMessages } from '@/app/lib/hooks/useFireMessages';
import type { ChatMessage, FireCachedUser, SessionDoc } from '@/app/lib/types';
import { MessagesServices } from '@/app/lib/utils/message/typeDefs';
import { toMillis } from '@/app/lib/utils/time';

import { FirePicker as ParticipantPicker, FireToast } from '../UI';
import MessageComposer from './MessageComposer';
import MessageList from './MessageList';
import ParticipantsPanel from './ParticpantsPanel';
import SessionHeader from './SessionHeader';
import TypingIndicator from './TypingIndicator';

export interface OrchestraProps {
	session: SessionDoc;
	currentUser: FireCachedUser;
	profiles?: Record<string, FireCachedUser>;
	messageServices: MessagesServices;
	onLeaveSession?: (sessionId: string, userId: string) => Promise<void>;
	onEndSession?: (sessionId: string) => Promise<void>;
	onAddParticipant?: (sessionId: string, userId: string) => Promise<void>;
	onToggleLock?: (sessionId: string, locked: boolean) => Promise<void>;
	onUpdateMetadata?: (sessionId: string, updates: { title?: string }) => Promise<void>;
	fetchFrequentUsers?: (forUid: string) => Promise<FireCachedUser[]>;
	searchUsers?: (query: string) => Promise<FireCachedUser[]>;
}

const Orchestra: React.FC<OrchestraProps> = React.memo(({
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

	// Refs for stable values
	const sessionIdRef = useRef(session.id);
	const currentUserUidRef = useRef(currentUser.uid);
	const profilesRef = useRef(profiles);
	const routerRef = useRef(router);

	// Update refs when props change
	useEffect(() => {
		sessionIdRef.current = session.id;
		currentUserUidRef.current = currentUser.uid;
		profilesRef.current = profiles;
		routerRef.current = router;
	}, [session.id, currentUser.uid, profiles, router]);

	// Fetch frequent users ONCE
	useEffect(() => {
		if (!fetchFrequentUsers) return;

		let mounted = true;
		const loadFrequent = async () => {
			try {
				const users = await fetchFrequentUsers(currentUser.uid);
				if (mounted) setFrequentUsers(users.slice(0, 10));
			} catch {
				// Silent fail
			}
		};

		void loadFrequent();

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
      isSorted
	} = useFireMessages({
		sessionId: session.id!,
		userUid: currentUser.uid,
		services: messageServices,
		options: {
			initialLimit: 50,
			liveLimit: 150,
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
  if (!Array.isArray(messages) || messages.length === 0) return [];
  if (isSorted) return messages;
  
  return [...messages].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
}, [messages, isSorted]);

	// Create message lookup Map for O(1) access - memoized
	const messagesMap = useMemo(() => {
		const map = new Map<string, ChatMessage>();
		safeMessages.forEach(m => {
			if (m.id) map.set(m.id, m);
		});
		return map;
	}, [safeMessages]);

	/* <----------- STABLE HANDLERS WITH REFS -----------> */

	const handleSend = useCallback(
		async (text: string, replyToId?: string) => {
			try {
				const res = await sendMsg(text, replyToId);
				if (!res.ok) {
					toast.error('Failed to send');
					return;
				}
				setReplyingTo(undefined);
			} catch {
				toast.error('Failed to send message');
			}
		},
		[sendMsg]
	);

	const copyMessage = useCallback(async (text: string) => {
		if (!text) return toast.error('Nothing to copy');
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Message copied!');
		} catch {
			toast.error('Failed to copy message');
		}
	}, []);

	const handleDelete = useCallback(
		async (messageId?: string) => {
			if (!messageId) {
				toast.error('Invalid Message');
				return;
			}
			try {
				const res = await deleteMessage(messageId);
				if (!res.ok) {
					toast.error(`Failed to delete: ${res.error}`);
					return;
				}
			} catch {
				toast.error('Failed to delete message');
			}
		},
		[deleteMessage]
	);

	// CRITICAL: Use Map for O(1) lookup instead of array.find()
	const handleToggleReaction = useCallback(
		async (messageId: string, emoji: string) => {
			const message = messagesMap.get(messageId);
			if (!message) return toast.error('Message not found');

			const hasReacted = !!message.reactions?.[emoji]?.includes(currentUserUidRef.current);

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
		[messagesMap, addReact, removeReact]
	);

	const handleEndSession = useCallback(async () => {
		if (!onEndSession || !sessionIdRef.current) {
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
							await onEndSession(sessionIdRef.current!);
							routerRef.current.push('/desk');
						} catch {
							// Parent handles errors
						}
					},
				},
			],
		});
	}, [onEndSession]);

	const handleLeaveSession = useCallback(async () => {
		if (!onLeaveSession || !sessionIdRef.current) {
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
							await onLeaveSession(sessionIdRef.current!, currentUserUidRef.current);
							routerRef.current.push('/desk');
						} catch {
							toast.error('Failed to leave session');
						}
					},
				},
			],
		});
	}, [onLeaveSession]);

	const handleAddParticipant = useCallback(
		async (uid: string) => {
			if (!onAddParticipant || !sessionIdRef.current) {
				return toast.error('Add participant not configured');
			}

			try {
				await onAddParticipant(sessionIdRef.current, uid);
			} catch {
				toast.error('Failed to add participant');
			}
		},
		[onAddParticipant]
	);

	const handleToggleLock = useCallback(
		async (locked: boolean) => {
			if (!onToggleLock || !sessionIdRef.current) {
				return toast.error('Toggle lock not configured');
			}

			try {
				await onToggleLock(sessionIdRef.current, locked);
			} catch {
				toast.error('Failed to update lock');
			}
		},
		[onToggleLock]
	);

	const handleUpdateMetadata = useCallback(
		async (updates: { title?: string }) => {
			if (!onUpdateMetadata || !sessionIdRef.current) {
				return;
			}

			try {
				await onUpdateMetadata(sessionIdRef.current, updates);
			} catch {
				toast.error('Failed to update session');
			}
		},
		[onUpdateMetadata]
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

	// Memoize participant count to prevent recalculation
	const participantCount = useMemo(
		() => session.participants?.length ?? 0,
		[session.participants?.length]
	);

	// Memoize session active state
	const isSessionActive = useMemo(() => session.isActive, [session.isActive]);

	return (
		<div className="flex flex-col h-screen bg-neutral-50">
			{/* Session header */}
			<SessionHeader
				session={session}
				participantCount={participantCount}
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
					<div className="flex gap-6 animate-slide-up">
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
							onReply={setReplyingTo}
                     onToggleReaction={handleToggleReaction}
                     onCopyMessage={copyMessage}
							onDeleteMessage={handleDelete}
						/>

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
							disabled={!isSessionActive || sending}
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
});


export default Orchestra;