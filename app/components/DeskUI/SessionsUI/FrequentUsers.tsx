'use client';

import { useCallback, useMemo, useState } from 'react';
import { FaUsers } from 'react-icons/fa';

import { isRecentlyActive } from '@/app/components/DeskUI/util';
import { FireAvatar } from '@/app/components/UI';
import { FireCachedUser, FireProfile } from '@/app/lib/types';

import ProfileSlide from './ProfileSlide';

interface FrequentUsersProps {
	users: FireCachedUser[];
	currentUser: FireProfile;
}

export const FrequentUsers: React.FC<FrequentUsersProps> = ({ users, currentUser }) => {
	const [selectedUser, setSelectedUser] = useState<FireCachedUser | null>(null);
	const [isSlideOpen, setIsSlideOpen] = useState(false);

	const handleUserClick = useCallback((user: FireCachedUser) => {
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
			<div className="mb-4 bg-white rounded-xl p-3 ring-neutral-200/30 ring-2 hover:shadow-sm transition-shadow">
				{/* Header */}
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<FaUsers className="w-3.5 h-3.5 text-neutral-500" />
						<h3 className="text-sm font-semibold text-neutral-900">Frequent</h3>
					</div>
					<span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
						{validUsers.length}
					</span>
				</div>

				{/* User List */}
				<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
									className="ring-2 ring-neutral-200 group-hover:ring-neutral-400 transition-all duration-200"
								/>
								{isRecentlyActive(user.lastSeen) && (
									<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
								)}
							</div>
							<div className="flex flex-col items-center gap-0 max-w-[64px]">
								<span className="text-xs font-medium text-neutral-700 truncate w-full text-center group-hover:text-neutral-900 transition-colors">
									{user.displayName}
								</span>
								<span className="text-[10px] text-neutral-400 truncate w-full text-center">
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
