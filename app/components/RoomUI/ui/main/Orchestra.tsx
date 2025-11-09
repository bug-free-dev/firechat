'use client';

import { useRouter } from 'next/navigation';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { ParticipantsPanel } from '@/app/components/RoomUI/ui/atoms';
import RoomTopBar from '@/app/components/RoomUI/ui/atoms/RoomTopBar';
import { MsgComposer, VMessageList } from '@/app/components/RoomUI/ui/blocks';
import { TypingIndicator } from '@/app/components/RoomUI/ui/indicators';
import { FireToast } from '@/app/components/UI';
import { FirePicker as ParticipantPicker } from '@/app/components/UI';
import { useFireMessages } from '@/app/lib/hooks/useFireMessages';
import type { CachedUser, ChatMessage, SessionDoc } from '@/app/lib/types';
import type { MessagesServices } from '@/app/lib/utils/message/typeDefs';

export interface OrchestraProps {
	session: SessionDoc;
	currentUser: CachedUser;
	profiles?: Record<string, CachedUser>;
	messageServices: MessagesServices;
	onLeaveSession?: (sessionId: string, userId: string) => Promise<void>;
	onEndSession?: (sessionId: string) => Promise<void>;
	onAddParticipant?: (sessionId: string, userId: string) => Promise<void>;
	onToggleLock?: (sessionId: string, locked: boolean) => Promise<void>;
	onUpdateMetadata?: (sessionId: string, updates: { title?: string }) => Promise<void>;
	fetchFrequentUsers?: (forUid: string) => Promise<CachedUser[]>;
	searchUsers?: (query: string) => Promise<CachedUser[]>;
}

const Orchestra: React.FC<OrchestraProps> = memo(
	({
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
		const [frequentUsers, setFrequentUsers] = useState<CachedUser[]>([]);

		const sessionIdRef = useRef(session.id);
		const currentUserUidRef = useRef(currentUser.uid);
		const routerRef = useRef(router);
		const loadedSessionsRef = useRef<Set<string>>(new Set());
		const reactionCacheRef = useRef<Map<string, boolean>>(new Map());

		useEffect(() => {
			sessionIdRef.current = session.id;
			currentUserUidRef.current = currentUser.uid;
			routerRef.current = router;
		}, [session.id, currentUser.uid, router]);

		useEffect(() => {
			if (!fetchFrequentUsers || loadedSessionsRef.current.has('frequent')) return;

			let mounted = true;
			const loadFrequent = async () => {
				try {
					const users = await fetchFrequentUsers(currentUser.uid);
					if (mounted) {
						setFrequentUsers(users.slice(0, 10));
						loadedSessionsRef.current.add('frequent');
					}
				} catch {}
			};

			void loadFrequent();

			return () => {
				mounted = false;
			};
		}, [fetchFrequentUsers, currentUser.uid]);

		const {
			messages,
			messagesMap,
			sending,
			typingUsers,
			isFetching,
			hasMore,
			setTyping,
			sendMessage: sendMsg,
			fetchOlder,
			addReaction: addReact,
			removeReaction: removeReact,
			deleteMessage,
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
				autoFetchInitial: true,
			},
		});

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
					toast.success('Message deleted');
				} catch {
					toast.error('Failed to delete message');
				}
			},
			[deleteMessage]
		);

		const handleToggleReaction = useCallback(
			async (messageId: string, emoji: string) => {
				const cacheKey = `${messageId}_${emoji}`;

				if (reactionCacheRef.current.get(cacheKey)) {
					return;
				}

				const message = messagesMap.get(messageId);
				if (!message) return toast.error('Message not found');

				const hasReacted = !!message.reactions?.[emoji]?.includes(currentUserUidRef.current);

				reactionCacheRef.current.set(cacheKey, true);

				try {
					const res = hasReacted
						? await removeReact(messageId, emoji)
						: await addReact(messageId, emoji);

					if (!res.ok) {
						toast.error(`Failed to ${hasReacted ? 'remove' : 'add'} reaction`);
					}
				} catch {
					toast.error('Failed to update reaction');
				} finally {
					setTimeout(() => {
						reactionCacheRef.current.delete(cacheKey);
					}, 300);
				}
			},
			[messagesMap, addReact, removeReact]
		);

		const handleLoadMore = useCallback(async () => {
			if (!hasMore || isFetching || messages.length === 0) return;

			const oldestMessage = messages[0];
			if (!oldestMessage?.createdAt) return;

			const cacheKey = `load_${oldestMessage.createdAt}`;
			if (loadedSessionsRef.current.has(cacheKey)) return;

			loadedSessionsRef.current.add(cacheKey);

			try {
				await fetchOlder(String(oldestMessage.createdAt));
			} catch {
				toast.error('Failed to load older messages');
				loadedSessionsRef.current.delete(cacheKey);
			}
		}, [hasMore, isFetching, messages, fetchOlder]);

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
								toast.error('Failed to end session');
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
					toast.success('Participant added');
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
				} catch {}
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
					toast.success('Session updated');
				} catch {
					toast.error('Failed to update session');
				}
			},
			[onUpdateMetadata]
		);

		const onPickerConfirm = useCallback(
			async (users: CachedUser[]) => {
				if (!users || users.length === 0) return;
				for (const u of users) {
					await handleAddParticipant(u.uid);
				}
			},
			[handleAddParticipant]
		);

		const participantCount = useMemo(
			() => session.participants?.length ?? 0,
			[session.participants?.length]
		);

		const isSessionActive = useMemo(() => session.isActive, [session.isActive]);

		const memoizedProfiles = useMemo(() => profiles, [profiles]);

		return (
			<div className="flex flex-col h-screen bg-neutral-50 overflow-hidden">
				{/* Top Bar with Tabs */}
				<div className="flex-none">
					<RoomTopBar
						session={session}
						userUid={currentUser.uid}
						participantCount={participantCount}
						activeTab={activeTab}
						onTabChange={setActiveTab}
						onEndSession={handleEndSession}
						onLeaveSession={handleLeaveSession}
						onOpenInvite={() => setInviteOpen(true)}
						onToggleLock={handleToggleLock}
						onUpdateMetadata={handleUpdateMetadata}
					/>
				</div>

				{/* Content Area */}
				<div className="flex-1 flex flex-col min-h-0 bg-white">
					{activeTab === 'chats' ? (
						<>
							<div className="flex-1 min-h-0 relative">
								<VMessageList
									messages={messages}
									messagesMap={messagesMap}
									currentUserUid={currentUser.uid}
									profiles={memoizedProfiles}
									isFetching={isFetching}
									hasMore={hasMore}
									onReply={setReplyingTo}
									onToggleReaction={handleToggleReaction}
									onCopyMessage={copyMessage}
									onDeleteMessage={handleDelete}
									onLoadMore={handleLoadMore}
								/>
							</div>

							{typingUsers.length > 0 && (
								<div className="flex-none m-1">
									<div className="max-w-4xl mx-auto">
										<TypingIndicator typingUsers={typingUsers} />
									</div>
								</div>
							)}

							<div className="flex-none bg-white border-t border-neutral-200">
								<div className="max-w-4xl mx-auto px-2">
									<MsgComposer
										onSend={handleSend}
										disabled={!isSessionActive || sending}
										replyingTo={replyingTo}
										replyToSender={
											replyingTo ? memoizedProfiles[replyingTo.sender] : undefined
										}
										onCancelReply={() => setReplyingTo(undefined)}
										onTyping={setTyping}
									/>
								</div>
							</div>
						</>
					) : (
						<div className="flex-1 overflow-y-auto">
							<ParticipantsPanel
								participants={session.participants}
								profiles={memoizedProfiles}
								currentUserUid={currentUser.uid}
								onOpenInvite={() => setInviteOpen(true)}
							/>
						</div>
					)}
				</div>

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
	}
);

export default Orchestra;
