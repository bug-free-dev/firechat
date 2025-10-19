'use client';

import Image from 'next/image';
import React from 'react';

export type OAuthProviders = 'google' | 'github';

type OAuthButtonProps = {
	label?: string;
	provider: OAuthProviders;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
	className?: string;
	disabled?: boolean;
};

export const OAuthButton: React.FC<OAuthButtonProps> = ({
	label,
	provider,
	onClick,
	className = '',
	disabled = false,
}) => {
	const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled) return;
		if (onClick) await onClick(e);
	};

	const base = `
    inline-flex items-center justify-center gap-2
    rounded-lg border border-neutral-200 bg-white
    px-5 py-2.5 text-sm font-medium text-neutral-700
    transition-colors duration-200 ease-in-out
    hover:bg-neutral-50
    active:bg-neutral-100/40
    focus:outline-none focus:ring-2 focus:ring-slate-400/30
  `;

	const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

	const providerLogo = provider === 'google' ? '/assets/google.svg' : '/assets/github.svg';
	const providerAlt = provider === 'google' ? 'Google' : 'GitHub';

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			aria-label={label || providerAlt}
			className={`${base} ${disabledClass} ${className}`}
		>
			<Image src={providerLogo} alt={providerAlt} width={20} height={20} />
			<span>{label || providerAlt}</span>
		</button>
	);
};
