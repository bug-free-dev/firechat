'use client';

import React from 'react';

interface MinimalIconProps {
	icon: React.ReactNode;
	label: string;
	tagline: string;
	bgClass: string;
	txtClass: string;
}

export const MinimalIcon: React.FC<MinimalIconProps> = ({ icon, label, tagline, bgClass, txtClass }) => {
	return (
		<div className="flex flex-col items-center gap-2 w-32">
			<div className={`${bgClass} p-3 rounded-full flex items-center justify-center`}>
				<div className={`${txtClass} w-5 h-5`}>{icon}</div>
			</div>
			<div className="text-sm font-medium text-neutral-800 text-center">{label}</div>
			<div className="text-xs text-neutral-500 text-center font-righteous">{tagline}</div>
		</div>
	);
};