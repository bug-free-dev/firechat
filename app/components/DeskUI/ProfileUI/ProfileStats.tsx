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
				<div className="p-1.5 rounded-lg bg-amber-50">
					<HiOutlineStar className="w-4 h-4 text-amber-500" />
				</div>
				<div className="flex items-baseline gap-1">
					<span className="text-lg font-semibold text-gray-900">{kudos}</span>
					<span className="text-xs text-gray-500">kudos</span>
				</div>
			</div>

			{status && (
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-lg bg-blue-50">
						<HiOutlineHashtag className="w-4 h-4 text-blue-500" />
					</div>
					<span className="text-sm text-gray-600">{status}</span>
				</div>
			)}
		</div>
	);
};
