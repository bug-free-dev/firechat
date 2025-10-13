'use client';

import React, { useState } from 'react';
import {
	FaEdit,
	FaLock,
	FaSave,
	FaSignOutAlt,
	FaTimes,
	FaUnlock,
	FaUserPlus,
	FaUsers,
} from 'react-icons/fa';

import { SessionDoc } from '@/app/lib/types';

import FireButton from '../UI/FireButton';

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
	};

	const handleSaveEdit = async () => {
		if (!onUpdateMetadata) return;
		const trimmedTitle = editedTitle.trim();
		if (trimmedTitle === session.title) return setIsEditing(false);

		setSaving(true);
		try {
			await onUpdateMetadata({ title: trimmedTitle });
			setIsEditing(false);
		} catch {
			setSaving(false);
		} finally {
			setSaving(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') void handleSaveEdit();
		else if (e.key === 'Escape') handleCancelEdit();
	};

	return (
		<div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
			<div className="px-3 sm:px-4 lg:px-6 mt-2 pb-2">
				<div className="flex items-center justify-between gap-3">
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
									className="flex-1 text-sm  bg-neutral-100/50 focus:bg-white focus:ring-neutral-300 ring-2 ring-neutral-100 px-2 py-1 rounded-t-sm focus:outline-none  border-none transition-all w-full"
								/>
								<FireButton
									onClick={handleSaveEdit}
									variant="secondary"
									size="small"
									disabled={saving}
									className="px-1.5 py-1 rounded-md"
								>
									<FaSave className="w-3 h-3" />
								</FireButton>
								<FireButton
									onClick={handleCancelEdit}
									variant="ghost"
									size="small"
									disabled={saving}
									className="px-1.5 py-1 rounded-md"
								>
									<FaTimes className="w-3 h-3 text-neutral-500" />
								</FireButton>
							</div>
						) : (
							<div className="flex items-center gap-1.5">
								<h2 className="font-semibold text-base text-neutral-800 truncate">
									{session.title || 'Chat Session'}
								</h2>
								{isCreator && onUpdateMetadata && (
									<button
										onClick={handleStartEdit}
										className="p-1 hover:bg-neutral-100 rounded-md transition-colors"
										aria-label="Edit title"
									>
										<FaEdit className="w-3.5 h-3.5 text-neutral-500" />
									</button>
								)}
							</div>
						)}

						<p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5 flex-wrap">
							<span className="flex items-center gap-1">
								<FaUsers className="w-3 h-3" />
								{participantCount}
							</span>
							<span className="text-neutral-300">•</span>
							{session.isLocked && (
								<>
									<span className="text-neutral-300">•</span>
									<FaLock className="w-3 h-3 text-cyan-600" />
								</>
							)}
						</p>
					</div>

					<div className="flex items-center gap-1.5">
						{isCreator && (
							<FireButton
								onClick={handleToggleLock}
								variant="ghost"
								size="small"
								className="px-2 py-1 text-xs"
							>
								{session.isLocked ? <FaUnlock /> : <FaLock />}
							</FireButton>
						)}

						{onOpenInvite && (
							<FireButton
								onClick={onOpenInvite}
								variant="secondary"
								size="small"
								className="px-2 py-1 text-xs"
							>
								<FaUserPlus />
							</FireButton>
						)}

						<FireButton
							onClick={isCreator ? onEndSession : onLeaveSession}
							variant={isCreator ? 'ghost' : 'secondary'}
							size="small"
							className={`flex items-center gap-1 px-2 py-1 text-xs ${
								isCreator ? 'text-rose-500 hover:bg-rose-50' : ''
							}`}
						>
							<FaSignOutAlt className="w-3 h-3" />
							<span>{isCreator ? 'End' : 'Leave'}</span>
						</FireButton>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SessionHeader;
