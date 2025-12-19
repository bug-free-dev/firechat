'use client';

import { HiOutlineHashtag, HiOutlineStar } from 'react-icons/hi';

type ProfileStatsProps = {
	kudos: number;
	status?: string | null;
};

export const ProfileStats: React.FC<ProfileStatsProps> = ({ kudos, status }) => {
	return (
		<div className="flex items-center gap-6">
			<div className="flex items-center gap-2">
				<div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 dark:ring-1 dark:ring-amber-900/20">
					<HiOutlineStar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
				</div>
				<div className="flex items-baseline gap-1">
					<span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
						{kudos}
					</span>
					<span className="text-xs text-neutral-500 dark:text-neutral-400">kudos</span>
				</div>
			</div>

			{status && (
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 dark:ring-1 dark:ring-blue-900/20">
						<HiOutlineHashtag className="w-4 h-4 text-blue-500 dark:text-blue-400" />
					</div>
					<span className="text-sm text-neutral-600 dark:text-neutral-300">{status}</span>
				</div>
			)}
		</div>
	);
};
