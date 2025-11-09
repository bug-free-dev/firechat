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
		} finally {
			setSaving(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') void handleSaveEdit();
		else if (e.key === 'Escape') handleCancelEdit();
	};

	return (
		<header className="w-full bg-white border-b border-neutral-200">
			{/* Top Section: Title & Actions */}
			<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
				<div className="flex items-center justify-between gap-4">
					{/* Left: Title */}
					<div className="min-w-0 flex-1">
						{isEditing ? (
							<div className="flex items-center gap-1.5">
								<input
									value={editedTitle}
									onChange={(e) => setEditedTitle(e.target.value)}
									onKeyDown={handleKeyDown}
									autoFocus
									placeholder="Session title"
									disabled={saving}
									className="bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400/10 focus:border-neutral-300/70 hover:border-neutral-300/50 px-2 max-w-40 min-w-10 text-sm py-1"
								/>
								<button
									onClick={handleSaveEdit}
									disabled={saving}
									className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
									aria-label="Save session title"
								>
									<FiCheck className="w-3.5 h-3.5" />
								</button>
								<button
									onClick={handleCancelEdit}
									disabled={saving}
									className="p-1.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-500 border border-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400/50"
									aria-label="Cancel edit"
								>
									<FiX className="w-3.5 h-3.5" />
								</button>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<h2 className="font-semibold text-base sm:text-lg text-neutral-800 truncate">
									{session.title || 'Untitled Session'}
								</h2>
								{isCreator && onUpdateMetadata && (
									<button
										onClick={handleStartEdit}
										aria-label="Edit session title"
										className="p-1 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300/50"
									>
										<FiEdit2 className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						)}

						{/* Meta Info */}
						<div className="mt-1 flex items-center flex-wrap gap-2 text-xs">
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60">
								<FiUsers className="w-3 h-3" />
								<span className="font-medium">{participantCount} alive</span>
							</span>

							{session.isLocked && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/60">
									<FiLock className="w-3 h-3" />
									<span className="font-medium">Locked</span>
								</span>
							)}
						</div>
					</div>

					{/* Right: Actions */}
					<div className="flex items-center gap-2">
						{isCreator && (
							<button
								onClick={handleToggleLock}
								className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-400/50"
								aria-label={session.isLocked ? 'Unlock session' : 'Lock session'}
							>
								{session.isLocked ? (
									<FiUnlock className="w-3.5 h-3.5" />
								) : (
									<FiLock className="w-3.5 h-3.5" />
								)}
								<span className="hidden sm:inline text-xs font-medium">
									{session.isLocked ? 'Unlock' : 'Lock'}
								</span>
							</button>
						)}

						{onOpenInvite && (
							<button
								onClick={onOpenInvite}
								className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 hover:border-sky-300 transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
								aria-label="Invite users"
							>
								<FiUserPlus className="w-3.5 h-3.5" />
								<span className="hidden sm:inline text-xs font-medium">Invite</span>
							</button>
						)}

						<button
							onClick={isCreator ? onEndSession : onLeaveSession}
							className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 ${
								isCreator
									? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 focus:ring-red-400/50'
									: 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300 focus:ring-neutral-400/50'
							}`}
							aria-label={isCreator ? 'End session' : 'Leave session'}
						>
							<FiLogOut className="w-3.5 h-3.5" />
							<span className="hidden sm:inline text-xs font-medium">
								{isCreator ? 'End' : 'Leave'}
							</span>
						</button>
					</div>
				</div>
			</div>

			{/* Bottom Section: Tabs */}
			<div className="border-t border-neutral-200/60">
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex gap-6 relative">
						<button
							ref={chatsRef}
							onClick={() => onTabChange('chats')}
							className={`py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
								activeTab === 'chats'
									? 'text-neutral-900'
									: 'text-neutral-500 hover:text-neutral-700'
							}`}
						>
							<FiMessageCircle
								className={`w-4 h-4 transition-transform ${
									activeTab === 'chats' ? 'scale-110' : ''
								}`}
							/>
							<span>Chats</span>
						</button>

						<button
							ref={participantsRef}
							onClick={() => onTabChange('participants')}
							className={`py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
								activeTab === 'participants'
									? 'text-neutral-900'
									: 'text-neutral-500 hover:text-neutral-700'
							}`}
						>
							<FiUsers
								className={`w-4 h-4 transition-transform ${
									activeTab === 'participants' ? 'scale-110' : ''
								}`}
							/>
							<span>Participants</span>
						</button>

						{/* Animated underline */}
						<div
							className="absolute -bottom-[1px] h-0.5 bg-neutral-900 transition-all duration-300 ease-out"
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
