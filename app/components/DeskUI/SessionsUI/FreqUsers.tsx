'use client';

import { useCallback, useMemo, useState } from 'react';
import { FaUsers } from 'react-icons/fa';

import { isRecentlyActive } from '@/app/components/DeskUI/util';
import { FireAvatar } from '@/app/components/UI';
import { CachedUser, FireProfile } from '@/app/lib/types';

import ProfileSlide from './ProfileSlide';

interface FrequentUsersProps {
	users: CachedUser[];
	currentUser: FireProfile;
}

export const FrequentUsers: React.FC<FrequentUsersProps> = ({ users, currentUser }) => {
	const [selectedUser, setSelectedUser] = useState<CachedUser | null>(null);
	const [isSlideOpen, setIsSlideOpen] = useState(false);

	const handleUserClick = useCallback((user: CachedUser) => {
		setSelectedUser(user);
		setIsSlideOpen(true);
	}, []);

	const handleCloseSlide = useCallback(() => {
		setIsSlideOpen(false);
		setTimeout(() => setSelectedUser(null), 300);
	}, []);

	const validUsers = useMemo(
		() => users.filter((user) => user.uid !== currentUser.uid && !user.isBanned),
		[users, currentUser.uid]
	);

	if (validUsers.length === 0) return null;

	return (
		<>
			<div className="mb-4 bg-white dark:bg-neutral-900 rounded-xl p-3 ring-2 ring-neutral-200/30 dark:ring-neutral-700/40 transition-colors">
				{/* Header */}
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<FaUsers className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
						<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
							Frequent
						</h3>
					</div>
					<span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
						{validUsers.length}
					</span>
				</div>

				{/* User List */}
				<div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
					{validUsers.map((user) => (
						<button
							key={user.uid}
							onClick={() => handleUserClick(user)}
							className="flex flex-col items-center gap-1.5 min-w-[64px] group focus:outline-none"
							title={user.displayName}
							type="button"
						>
							<div className="relative mt-1">
								<FireAvatar
									seed={user.uid}
									src={user.avatarUrl}
									size={48}
									className="ring-2 ring-neutral-200 dark:ring-neutral-700/40 group-hover:ring-neutral-400 dark:group-hover:ring-neutral-500 transition-all duration-200"
								/>
								{isRecentlyActive(user.lastSeen) && (
									<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900" />
								)}
							</div>
							<div className="flex flex-col items-center gap-0 max-w-[64px]">
								<span className="text-xs font-medium text-neutral-700 dark:text-neutral-100 truncate w-full text-center group-hover:text-neutral-900 dark:group-hover:text-neutral-50 transition-colors">
									{user.displayName}
								</span>
								<span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate w-full text-center">
									@{user.usernamey}
								</span>
							</div>
						</button>
					))}
				</div>
			</div>

			<ProfileSlide user={selectedUser} isOpen={isSlideOpen} onClose={handleCloseSlide} />
		</>
	);
};
