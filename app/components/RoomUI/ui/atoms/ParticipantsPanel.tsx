'use client';

import { FaUserPlus } from 'react-icons/fa';

import { FireAvatar } from '@/app/components/UI';
import type { CachedUser } from '@/app/lib/types';

export interface ParticipantsPanelProps {
	participants: string[];
	profiles: Record<string, CachedUser>;
	currentUserUid: string;
	onOpenInvite?: () => void;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
	participants,
	profiles,
	currentUserUid,
	onOpenInvite,
}) => {
	return (
		<div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 scroll">
			<div className="max-w-2xl mx-auto space-y-2">
				{onOpenInvite && (
					<button
						onClick={() => onOpenInvite()}
						className="
							w-full flex items-center justify-center gap-2 p-3
							bg-neutral-50 border border-dashed border-neutral-300 rounded-xl
							hover:border-sky-400 hover:bg-cyan-50/50
							dark:bg-zinc-800 dark:border-zinc-700 dark:text-neutral-300
							dark:hover:border-sky-400 dark:hover:bg-cyan-900/50
							transition-all text-neutral-600
						"
					>
						<FaUserPlus className="w-4 h-4" />
						<span className="font-medium text-sm">Add Participant</span>
					</button>
				)}

				{participants.map((uid) => {
					const profile = profiles[uid];
					const isMe = uid === currentUserUid;

					return (
						<div
							key={uid}
							className="
								flex items-center gap-3 p-3
								bg-white border border-neutral-200 rounded-xl
								dark:bg-zinc-900 dark:border-neutral-700 dark:text-neutral-300
							"
						>
							<FireAvatar seed={uid} size={44} src={profile?.avatarUrl ?? null} />
							<div className="flex-1 min-w-0">
								<div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
									<span className="truncate">
										{profile?.displayName ?? profile?.usernamey ?? 'Unknown'}
									</span>
									{isMe && (
										<span className="text-xs bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400 px-2 py-0.5 rounded-full font-medium">
											You
										</span>
									)}
								</div>
								<div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
									@{profile?.usernamey ?? 'unknown'}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ParticipantsPanel;
