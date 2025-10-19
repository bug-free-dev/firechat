'use client';

import React from 'react';

interface MinimalIconProps {
	icon: React.ReactNode;
	label: string;
	bgClass: string;
	txtClass: string;
}

export const MinimalIcon: React.FC<MinimalIconProps> = ({ icon, label, bgClass, txtClass }) => {
	return (
		<div className="flex flex-col items-center gap-2 w-24">
			<div className={`${bgClass} p-3 rounded-full flex items-center justify-center`}>
				<div className={`${txtClass} w-5 h-5`}>{icon}</div>
			</div>
			<div className="text-sm text-neutral-700/50 text-center">{label}</div>
		</div>
	);
};
