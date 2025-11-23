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
    active:bg-neutral-100/10
    focus:outline-none focus:ring-2 focus:ring-slate-400/30
  focus:ring-offset-2 focus:ring-offset-white

  dark:bg-neutral-800/30
  dark:text-neutral-200
  dark:border-neutral-700/40
  dark:hover:bg-neutral-800/60
  dark:active:bg-neutral-800/40
  dark:focus:ring-neutral-600/40
  dark:focus:ring-offset-2 dark:focus:ring-offset-neutral-900
  backdrop-blur-sm
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
