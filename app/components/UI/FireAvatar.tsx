import React from 'react';

interface FireAvatarProps {
	seed: string; // Dicebear seed (username, email, etc.)
	size?: number; // width & height
	theme?: string; // Dicebear style: "initials", "bottts", "adventurer", etc.
	background?: string; // hex background, default transparent
	radius?: number; // corner radius percentage, default 50
	className?: string; // additional Tailwind classes
	altText?: string; // customizable alt text
	src?: string | null;
}

const FireAvatar: React.FC<FireAvatarProps> = ({
	seed,
	src,
	size = 40,
	theme = 'adventurer-neutral',
	background = '#ffffff00',
	radius = 50,
	className,
	altText = `FireAvatar of ${seed}`,
}: FireAvatarProps) => {
	const url = `https://api.dicebear.com/6.x/${theme}/svg?seed=${encodeURIComponent(
		seed
	)}&background=${encodeURIComponent(background)}&radius=${radius}`;
	return (
		<img
			src={src || url}
			width={size}
			height={size}
			alt={altText}
			referrerPolicy="no-referrer"
			className={`rounded-full border border-gray-200 ${className || ''}`}
		/>
	);
};

export default FireAvatar;
