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
		<div className="bg-white rounded-xl border border-neutral-200 p-3 hover:shadow-sm transition-all duration-200">
			{/* User Info */}
			<div className="flex items-center gap-3 mb-3">
				<FireAvatar src={user.avatarUrl} seed={user.uid} size={40} />
				<div className="flex-1 min-w-0">
					<div className="font-semibold text-sm text-neutral-900 truncate">
						@{user.usernamey}
					</div>
					<div className="text-xs text-neutral-500 flex items-center gap-2">
						<FiGift className="w-3 h-3 text-yellow-500" />
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
						className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
							a > currentUserKudos
								? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
								: 'bg-neutral-800 text-white hover:bg-neutral-700'
						}`}
					>
						+{a}
					</button>
				))}
				<button
					onClick={() => onOpenDetailed(user)}
					className="px-2 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg transition-colors"
					aria-label={`Send custom amount to ${user.usernamey}`}
				>
					<FiSend className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};
