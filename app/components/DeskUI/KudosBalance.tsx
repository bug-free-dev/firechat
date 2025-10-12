'use client';

import Image from 'next/image';

interface KudosBalanceProps {
	kudosBalance: number;
}

export default function KudosBalance({ kudosBalance }: KudosBalanceProps) {
	return (
		<>
			<div className="flex items-center gap-3 px-5 py-2 bg-yellow-50 rounded-2xl border-2 border-yellow-300 shadow transition-shadow">
				{/* Kudos Image */}
				<Image
					src="/assets/Kudos.svg"
					alt="kudos"
					width={40}
					height={40}
					className="flex-shrink-0"
				/>

				{/* Balance */}
				<div className="flex-1">
					<span className="font-bold text-xl text-yellow-700">
						{kudosBalance.toLocaleString()}
					</span>
				</div>

				{/* Label */}
				<span className="text-sm font-semibold text-yellow-700 px-3 py-1 bg-yellow-100 rounded-full">
					kudos
				</span>
			</div>
		</>
	);
}
