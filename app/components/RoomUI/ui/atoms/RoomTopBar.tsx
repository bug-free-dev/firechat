'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
	FiCheck,
	FiEdit2,
	FiLock,
	FiLogOut,
	FiMessageCircle,
	FiUnlock,
	FiUserPlus,
	FiUsers,
	FiX,
} from 'react-icons/fi';

import { FireButton, FireInput } from '@/app/components/UI';
import type { SessionDoc } from '@/app/lib/types';

interface RoomTopBarProps {
	session: SessionDoc;
	userUid: string;
	participantCount: number;
	activeTab: 'chats' | 'participants';
	onTabChange: (tab: 'chats' | 'participants') => void;
	onEndSession: () => void;
	onLeaveSession: () => void;
	onOpenInvite?: () => void;
	onToggleLock: (locked: boolean) => void;
	onUpdateMetadata?: (updates: { title?: string }) => Promise<void>;
}

const RoomTopBar: React.FC<RoomTopBarProps> = ({
	session,
	userUid,
	participantCount,
	activeTab,
	onTabChange,
	onEndSession,
	onLeaveSession,
	onOpenInvite,
	onToggleLock,
	onUpdateMetadata,
}) => {
	const isCreator = userUid === session.creator;
	const [isEditing, setIsEditing] = useState(false);
	const [editedTitle, setEditedTitle] = useState(session.title || '');
	const [saving, setSaving] = useState(false);

	const chatsRef = useRef<HTMLButtonElement>(null);
	const participantsRef = useRef<HTMLButtonElement>(null);
	const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

	useEffect(() => {
		const activeRef = activeTab === 'chats' ? chatsRef : participantsRef;
		if (activeRef.current) {
			const { offsetLeft, offsetWidth } = activeRef.current;
			setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
		}
	}, [activeTab]);

	const handleToggleLock = () => onToggleLock(!session.isLocked);

	const handleStartEdit = () => {
		setEditedTitle(session.title || '');
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setEditedTitle(session.title || '');
		setIsEditing(false);
		setSaving(false);
	};

	const handleSaveEdit = async () => {
		if (!onUpdateMetadata) return setIsEditing(false);
		const trimmed = editedTitle.trim();
		if (trimmed === session.title) return setIsEditing(false);

		setSaving(true);
		try {
			await onUpdateMetadata({ title: trimmed });
			setIsEditing(false);
		} catch {
			// swallow, preserving existing behaviour
		} finally {
			setSaving(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') void handleSaveEdit();
		else if (e.key === 'Escape') handleCancelEdit();
	};

	return (
		<header className="w-full bg-white border-b border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
			{/* Top Section: Title & Actions */}
			<div className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
				<div className="flex items-center justify-between gap-3">
					{/* Left: Title */}
					<div className="min-w-0 flex-1">
						{isEditing ? (
							<div className="flex items-center gap-2">
								<FireInput
									value={editedTitle}
									onChange={(e) => setEditedTitle(e.target.value)}
									onKeyDown={handleKeyDown}
									autoFocus
									placeholder="Session title"
									disabled={saving}
									size="xs"
									variant="default"
									inputClassName="max-w-[12rem]"
									containerClassName=""
								/>

								<FireButton
									onClick={handleSaveEdit}
									disabled={saving}
									size="xs"
									variant="default"
									aria-label="Save session title"
								>
									<FiCheck className="w-3 h-3" />
								</FireButton>

								<FireButton
									onClick={handleCancelEdit}
									disabled={saving}
									size="xs"
									variant="secondary"
									aria-label="Cancel edit"
								>
									<FiX className="w-3 h-3" />
								</FireButton>
							</div>
						) : (
							<div className="flex items-center gap-1.5">
								<h2 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 truncate">
									{session.title || 'Untitled Session'}
								</h2>
								{isCreator && onUpdateMetadata && (
									<FireButton
										onClick={handleStartEdit}
										size="xs"
										variant="ghost"
										aria-label="Edit session title"
									>
										<FiEdit2 className="w-3 h-3" />
									</FireButton>
								)}
							</div>
						)}

						{/* Meta Info */}
						<div className="mt-1 flex items-center flex-wrap gap-1.5 text-xs">
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-200 border border-sky-200/50">
								<FiUsers className="w-3 h-3" />
								<span className="font-medium">{participantCount} alive</span>
							</span>
							{session.isLocked && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-200 border border-cyan-200/50">
									<FiLock className="w-3 h-3" />
									<span className="font-medium">Locked</span>
								</span>
							)}
						</div>
					</div>

					{/* Right: Actions */}
					<div className="flex items-center gap-1.5">
						{isCreator && (
							<FireButton
								onClick={handleToggleLock}
								size="xs"
								variant="outline"
								aria-label={session.isLocked ? 'Unlock session' : 'Lock session'}
							>
								{session.isLocked ? (
									<FiUnlock className="w-3 h-3" />
								) : (
									<FiLock className="w-3 h-3" />
								)}
							</FireButton>
						)}

						{onOpenInvite && (
							<FireButton
								onClick={onOpenInvite}
								size="xs"
								variant="secondary"
								aria-label="Invite users"
							>
								<FiUserPlus className="w-3 h-3" />
							</FireButton>
						)}

						<FireButton
							onClick={isCreator ? onEndSession : onLeaveSession}
							size="xs"
							variant={isCreator ? 'outline' : 'default'}
							destructive={true}
							aria-label={isCreator ? 'End session' : 'Leave session'}
						>
							<FiLogOut className="w-3 h-3" strokeWidth={2} />
						</FireButton>
					</div>
				</div>
			</div>

			{/* Bottom Section: Tabs */}
			<div className="border-t border-neutral-200/60 dark:border-neutral-700/60">
				<div className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-6">
					<div className="flex gap-4 relative">
						<button
							ref={chatsRef}
							onClick={() => onTabChange('chats')}
							className={`py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
								activeTab === 'chats'
									? 'text-neutral-900 dark:text-neutral-100'
									: 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
							}`}
						>
							<FiMessageCircle
								className={`w-4 h-4 ${activeTab === 'chats' ? 'scale-110' : ''}`}
							/>
							<span>Chats</span>
						</button>

						<button
							ref={participantsRef}
							onClick={() => onTabChange('participants')}
							className={`py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
								activeTab === 'participants'
									? 'text-neutral-900 dark:text-neutral-100'
									: 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
							}`}
						>
							<FiUsers
								className={`w-4 h-4 ${activeTab === 'participants' ? 'scale-110' : ''}`}
							/>
							<span>Participants</span>
						</button>

						{/* Animated underline */}
						<div
							className="absolute -bottom-[1px] h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-300 ease-out"
							style={{
								left: `${underlineStyle.left}px`,
								width: `${underlineStyle.width}px`,
							}}
						/>
					</div>
				</div>
			</div>
		</header>
	);
};

export default RoomTopBar;
