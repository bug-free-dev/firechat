'use client';

import React from 'react';

import { getSvgUrl } from './avatarHelpers';

export interface FireAvatarProps {
	seed: string;
	size?: number;
	theme?: string;
	background?: string;
	radius?: number;
	className?: string;
	altText?: string;
	src?: string | null;
}

export const FireAvatar: React.FC<FireAvatarProps> = ({
	seed,
	src,
	size = 40,
	theme = 'adventurer-neutral',
	background = '#ffffff00',
	radius = 50,
	className,
	altText = `FireAvatar of ${seed}`,
}: FireAvatarProps) => {
	const url = getSvgUrl({
		seed,
		theme,
		background,
		radius,
		size,
	});

	return (
		<img
			src={src || url}
			width={size}
			height={size}
			alt={altText}
			referrerPolicy="no-referrer"
			className={`rounded-full ring-neutral-300/60 ring-2 ${className ?? ''}`}
		/>
	);
};
