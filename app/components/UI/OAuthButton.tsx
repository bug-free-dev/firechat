// app/components/OAuthButton.tsx
'use client';

import { type Auth, type AuthProvider, signInWithPopup, type UserCredential } from 'firebase/auth';
import React from 'react';
import { toast } from 'react-hot-toast';

type OAuthButtonProps = {
	/** Visible label (e.g. "Continue with Google") */
	label?: string;
	/** Small icon node (react-icons recommended) */
	icon?: React.ReactNode;
	/** Firebase auth instance (optional) - required if you want this component to call signInWithPopup itself */
	auth?: Auth;
	/** Firebase provider (optional) - required if you want built-in sign-in behavior */
	provider?: AuthProvider;
	/** Custom onClick handler (optional) — used if you want to handle sign-in externally */
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
	/** extra classes */
	className?: string;
	/** disabled */
	disabled?: boolean;
	/** small / medium sizing */
	size?: 'sm' | 'md';
	/** called when sign-in succeeds */
	onSuccess?: (cred: UserCredential) => void;
	/** called when sign-in fails */
	onError?: (err: unknown) => void;
};

export default function OAuthButton({
	label = 'Continue',
	icon,
	auth,
	provider,
	onClick,
	className = '',
	disabled = false,
	size = 'md',
	onSuccess,
	onError,
}: OAuthButtonProps) {
	const isBuiltIn = !!auth && !!provider;

	const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled) return;
		// If user provided a custom onClick, prefer that
		if (onClick) {
			try {
				await onClick(e);
			} catch (err) {
				toast.error('Sign-in failed. Try again.');
				onError?.(err);
			}
			return;
		}

		// If provider + auth supplied, do built-in sign in
		if (isBuiltIn && auth && provider) {
			try {
				const cred = await signInWithPopup(auth, provider);
				toast.success('Signed in — welcome!');
				onSuccess?.(cred);
			} catch (err) {
				toast.error('Sign-in failed. Try again.');
				onError?.(err);
			}
			return;
		}
	};

	const sizeClasses = size === 'sm' ? 'py-2 px-3 text-sm' : 'py-2.5 px-4 text-sm';
	const base = `inline-flex items-center gap-3 justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition ${sizeClasses}`;
	const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			aria-label={label}
			className={`${base} ${disabledClass} ${className}`}
		>
			{icon && <span className="inline-flex items-center">{icon}</span>}
			<span className="font-medium text-neutral-700">{label}</span>
		</button>
	);
}
