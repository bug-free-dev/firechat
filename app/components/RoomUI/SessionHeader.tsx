'use client';

import React, { useState } from 'react';
import {
	FiCheck,
	FiEdit2,
	FiLock,
	FiLogOut,
	FiUnlock,
	FiUserPlus,
	FiUsers,
	FiX,
} from 'react-icons/fi';
import { RiPlanetLine } from 'react-icons/ri';

import { SessionDoc } from '@/app/lib/types';

import { FireInput } from '../UI';

interface SessionHeaderProps {
	session: SessionDoc;
	userUid: string;
	participantCount: number;
	onEndSession: () => void;
	onLeaveSession: () => void;
	onOpenInvite?: () => void;
	onToggleLock: (locked: boolean) => void;
	onUpdateMetadata?: (updates: { title?: string }) => Promise<void>;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
	session,
	userUid,
	participantCount,
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
			// allow caller to surface errors if needed
		} finally {
			setSaving(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') void handleSaveEdit();
		else if (e.key === 'Escape') handleCancelEdit();
	};

	return (
		<header className="relative w-full bg-white backdrop-blur-sm overflow-hidden border-b-neutral-300 border-b">
			<div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in-up">
				<div className="flex items-center justify-between gap-4">
					<div className="min-w-0 flex-1">
						{isEditing ? (
							<div className="flex items-center gap-2 animate-scale-in">
								<FireInput
									value={editedTitle}
									onChange={(e) => setEditedTitle(e.target.value)}
									onKeyDown={handleKeyDown}
									autoFocus
									placeholder="Session title"
									disabled={saving}
									inputSize="sm"
									className="min-w-0"
								/>
								<button
									onClick={handleSaveEdit}
									disabled={saving}
									className="p-2 rounded-lg ring-2 ring-emerald-200/70 bg-emerald-50/50 hover:bg-emerald-100/80 text-emerald-600 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-emerald-400/70 focus:ring-offset-2"
									aria-label="Save session title"
								>
									<FiCheck className="w-3 h-3" strokeWidth={2.5} />
								</button>

								<button
									onClick={handleCancelEdit}
									disabled={saving}
									className="p-2 rounded-lg ring-2 ring-neutral-200/70 bg-white/50 hover:bg-neutral-50 text-neutral-500 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-neutral-400/70 focus:ring-offset-2"
									aria-label="Cancel edit"
								>
									<FiX className="w-3 h-3" strokeWidth={2.5} />
								</button>
							</div>
						) : (
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2">
									<RiPlanetLine className="w-6 h-6 text-sky-500/70" />
									<h2 className="font-semibold text-lg sm:text-xl text-neutral-800 truncate">
										{session.title || 'Untitled Session'}
									</h2>
								</div>

								{isCreator && onUpdateMetadata && (
									<button
										onClick={handleStartEdit}
										aria-label="Edit session title"
										className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-white/60 ring-1 ring-transparent hover:ring-neutral-200/70 transition-all duration-200 focus:outline-none focus:ring-violet-400/70 focus:ring-offset-2"
									>
										<FiEdit2
											className="w-3.5 h-3.5 text-neutral-500/70"
											strokeWidth={2}
										/>
									</button>
								)}
							</div>
						)}

						<div className="mt-2 flex items-center flex-wrap gap-3 text-xs">
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 ring-1 ring-neutral-200/70 text-neutral-600/70">
								<FiUsers className="w-3.5 h-3.5 text-blue-500/70" strokeWidth={2} />
								<span className="font-medium">{participantCount}</span>
								<span className="text-neutral-500/70">online</span>
							</span>

							{session.isLocked && (
								<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50/80 ring-1 ring-cyan-200/70 text-cyan-700/70">
									<FiLock className="w-3.5 h-3.5" strokeWidth={2} />
									<span className="font-medium">Locked</span>
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						{isCreator && (
							<button
								onClick={handleToggleLock}
								className="px-3 py-2 rounded-lg ring-2 ring-neutral-200/70 bg-white/60 hover:bg-white hover:ring-neutral-300/70 text-neutral-700/70 transition-all duration-200 hover:scale-105 flex items-center gap-2 focus:outline-none focus:ring-violet-400/70 focus:ring-offset-2"
								aria-label={session.isLocked ? 'Unlock session' : 'Lock session'}
							>
								{session.isLocked ? (
									<FiUnlock className="w-3 h-3" strokeWidth={2} />
								) : (
									<FiLock className="w-3 h-3" strokeWidth={2} />
								)}
								<span className="hidden sm:inline text-sm font-medium">
									{session.isLocked ? 'Unlock' : 'Lock'}
								</span>
							</button>
						)}

						{onOpenInvite && (
							<button
								onClick={onOpenInvite}
								className="px-3 py-2 rounded-lg ring-2 ring-blue-200/70 bg-blue-50/60 hover:bg-blue-100/80 hover:ring-blue-300/70 text-blue-600/70 transition-all duration-200 hover:scale-105 flex items-center gap-2 focus:outline-none focus:ring-blue-400/70 focus:ring-offset-2"
								aria-label="Invite users"
							>
								<FiUserPlus className="w-3 h-3" strokeWidth={2} />
								<span className="hidden sm:inline text-sm font-medium">Invite</span>
							</button>
						)}

						<button
							onClick={isCreator ? onEndSession : onLeaveSession}
							className={`px-3 py-2 rounded-lg ring-2 transition-all duration-200 hover:scale-105 flex items-center gap-2 focus:outline-none focus:ring-offset-2 ${
								isCreator
									? 'ring-red-200/70 bg-red-50/60 hover:bg-red-100/80 hover:ring-red-300/70 text-red-600/70 focus:ring-red-400/70'
									: 'ring-neutral-200/70 bg-white/60 hover:bg-neutral-50 hover:ring-neutral-300/70 text-neutral-700/70 focus:ring-neutral-400/70'
							}`}
							aria-label={isCreator ? 'End session' : 'Leave session'}
						>
							<FiLogOut className="w-3 h-3" strokeWidth={1.5} />
							<span className="hidden sm:inline text-sm font-medium">
								{isCreator ? 'End' : 'Leave'}
							</span>
						</button>
					</div>
				</div>
			</div>
		</header>
	);
};

export default SessionHeader;
