'use client';

import { FiGift, FiSend } from 'react-icons/fi';

import { FireAvatar } from '@/app/components/UI';

import type { KudosCardProps } from './propsType';

export const KudosCard: React.FC<KudosCardProps> = ({
	user,
	quickAmounts,
	currentUserKudos,
	loading,
	onQuickSend,
	onOpenDetailed,
}) => {
	return (
		<div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700/50 p-4 transition-all duration-200">
			{/* User Info */}
			<div className="flex items-center gap-3 mb-4">
				<FireAvatar src={user.avatarUrl} seed={user.uid} size={40} />
				<div className="flex-1 min-w-0">
					<div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
						@{user.usernamey}
					</div>
					<div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
						<FiGift className="w-3 h-3 text-amber-500" />
						<span>{user.kudos ?? 0}</span>
						<span>·</span>
						<span>{String(user.meta?.mood ?? '—')}</span>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex items-center gap-2">
				{quickAmounts.map((a) => (
					<button
						key={a}
						onClick={() => onQuickSend(user, a)}
						disabled={loading || a > currentUserKudos}
						className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-700/40 ${
							a > currentUserKudos
								? 'bg-neutral-200 dark:bg-neutral-700/40 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
								: 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700/60'
						}`}
					>
						+{a}
					</button>
				))}
				<button
					onClick={() => onOpenDetailed(user)}
					className="px-3 py-2 bg-yellow-50 dark:bg-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-500 text-yellow-600 dark:text-yellow-100 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-400"
					aria-label={`Send custom amount to ${user.usernamey}`}
				>
					<FiSend className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};
