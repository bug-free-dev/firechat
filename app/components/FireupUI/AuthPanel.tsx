'use client';

import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { PiFireLight } from 'react-icons/pi';
import { LuRocket } from 'react-icons/lu';

import FireTabSwitcher from '@/app/components/UI/FireTabSwitcher';
import FireButton from '@/app/components/UI/FireButton';
import FireInput from '@/app/components/UI/FireInput';
import OAuthButton from '@/app/components/UI/OAuthButton';
import { sendResetPasswordEmail } from '@/app/lib/utils/auth';
import { sleep } from '@/app/lib/utils/time';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';

interface Props {
	activeTab: 'login' | 'signup';
	onTabChange: (tab: 'login' | 'signup') => void;
}

export default function AuthForm({ activeTab, onTabChange }: Props) {
	const {
		signIn,
		signUp,
		signInWithGoogle,
		signInWithGithub,
		isLoading: contextLoading,
	} = useAuthState();

	const [signin, setSignin] = useState({ email: '', password: '' });
	const [signup, setSignup] = useState({ displayName: '', email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [oauthLoading, setOauthLoading] = useState<{ g?: boolean; gh?: boolean }>({});

	// Swipe tracking
	const touchStartX = useRef<number | null>(null);
	const touchEndX = useRef<number | null>(null);
	const SWIPE_THRESHOLD = 50;

	const toastSuccess = (text: string) => toast.success(text);
	const toastError = (text: string) => toast.error(text);

	/* ---------------------- SWIPE HANDLERS ---------------------- */

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.changedTouches[0].clientX;
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		touchEndX.current = e.changedTouches[0].clientX;
		handleSwipe();
	};

	const handleSwipe = () => {
		if (touchStartX.current === null || touchEndX.current === null) return;

		const diff = touchStartX.current - touchEndX.current;

		// Swipe left (positive diff) -> go to signup
		if (diff > SWIPE_THRESHOLD && activeTab === 'login') {
			onTabChange('signup');
		}

		// Swipe right (negative diff) -> go to login
		if (diff < -SWIPE_THRESHOLD && activeTab === 'signup') {
			onTabChange('login');
		}

		touchStartX.current = null;
		touchEndX.current = null;
	};

	/* ---------------------- EMAIL/PASSWORD AUTH ---------------------- */

	const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
		e?.preventDefault();
		setLoading(true);

		try {
			if (activeTab === 'signup') {
				if (!signup.displayName.trim()) {
					toastError('Please enter your display name.');
					setLoading(false);
					return;
				}

				const res = await signUp(
					signup.displayName.trim(),
					signup.email.trim(),
					signup.password
				);

				if (!res.ok) {
					toastError(res.error || 'Registration failed.');
					setLoading(false);
					return;
				}

				toastSuccess('Account created! A verification email was sent to your address.');
				setSignup({ displayName: '', email: '', password: '' });
				onTabChange('login');
			} else {
				const res = await signIn(signin.email.trim(), signin.password);

				if (!res.ok) {
					toastError(res.error || 'Sign-in failed.');
					setLoading(false);
					return;
				}

				toastSuccess('Welcome back! Signed in successfully.');
				setSignin({ email: '', password: '' });

				window.location.reload();
			}
		} catch {
			toastError('Authentication failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleForgot = async () => {
		const email = activeTab === 'login' ? signin.email.trim() : signup.email.trim();
		if (!email) {
			toastError('Please enter an email address first.');
			return;
		}

		setLoading(true);
		try {
			const res = await sendResetPasswordEmail(email);
			if (!res.ok) {
				if (res.error.code === 'user-not-found') {
					toastError('No account found with that email.');
				} else if (res.error.code === 'invalid-email') {
					toastError('That email address looks invalid.');
				} else {
					toastError('Failed to send reset link. Try again later.');
				}
			} else {
				toastSuccess('Password reset link sent! Check your inbox.');
			}
		} catch {
			toastError('Failed to send reset link. Try again later.');
		} finally {
			setLoading(false);
		}
	};

	/* ---------------------- OAUTH HANDLERS ---------------------- */

	const handleGoogle = async (): Promise<void> => {
		setOauthLoading((s) => ({ ...s, g: true }));
		try {
			const res = await signInWithGoogle();
			if (!res.ok) {
				toastError(res.error ?? 'Google sign-in failed');
				return;
			}
			toastSuccess('Signed in with Google — welcome!');
			window.location.reload();
			await sleep(500);
		} catch {
			toastError('Google sign-in failed');
		} finally {
			setOauthLoading((s) => ({ ...s, g: false }));
		}
	};

	const handleGithub = async (): Promise<void> => {
		setOauthLoading((s) => ({ ...s, gh: true }));
		try {
			const res = await signInWithGithub();
			if (!res.ok) {
				toastError(res.error ?? 'GitHub sign-in failed');
				return;
			}
			toastSuccess('Signed in with GitHub — nice!');
			window.location.reload();
			await sleep(500);
		} catch {
			toastError('GitHub sign-in failed');
		} finally {
			setOauthLoading((s) => ({ ...s, gh: false }));
		}
	};

	// Combined loading state
	const isLoading = loading || contextLoading || oauthLoading.g || oauthLoading.gh;

	return (
		<div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="w-full">
			<FireTabSwitcher
				activeTab={activeTab}
				onTabChange={(t) => onTabChange(t as 'login' | 'signup')}
				tabs={[
					{ id: 'login', label: 'Sign In' },
					{ id: 'signup', label: 'Sign Up' },
				]}
				className="w-full"
			/>

			<h2 className="mt-6 font-bold text-2xl text-neutral-900 dark:text-neutral-100 text-center mb-1">
				{activeTab === 'login' ? (
					<span className="inline-flex items-center gap-2 ">
						<PiFireLight className="text-orange-500 h-8 w-8" /> Welcome Back
					</span>
				) : (
					<span className="inline-flex items-center gap-2">
						<LuRocket className="text-blue-500" /> Create Your Desk
					</span>
				)}
			</h2>

			<p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed text-center">
				{activeTab === 'login'
					? 'Sign in to continue chatting with your classmates.'
					: "Sign up to get started — we'll send a verification link to confirm your email."}
			</p>

			<div className="mt-6 space-y-4">
				{/* OAuth Row */}
				<div className="flex gap-3">
					<OAuthButton
						onClick={handleGoogle}
						disabled={isLoading}
						className="flex-1"
						label="Google"
						icon={<FaGoogle className="text-rose-500" />}
					/>
					<OAuthButton
						onClick={handleGithub}
						disabled={isLoading}
						className="flex-1"
						label="GitHub"
						icon={<FaGithub className="text-neutral-700 dark:text-neutral-200" />}
					/>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
					<div className="text-xs text-neutral-400 dark:text-neutral-400 bg-white dark:bg-neutral-800/60 px-3 py-1 rounded-full shadow-sm border border-neutral-100 dark:border-neutral-700">
						or continue with email
					</div>
					<div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
				</div>

				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					{activeTab === 'signup' && (
						<FireInput
							label="Full name"
							value={signup.displayName}
							onChange={(e) => setSignup((s) => ({ ...s, displayName: e.target.value }))}
							placeholder="Your 100% real name."
							required
							variant="default"
							disabled={isLoading}
						/>
					)}

					<FireInput
						label="Email"
						value={activeTab === 'login' ? signin.email : signup.email}
						onChange={(e) =>
							activeTab === 'login'
								? setSignin((s) => ({ ...s, email: e.target.value }))
								: setSignup((s) => ({ ...s, email: e.target.value }))
						}
						type="email"
						placeholder="you@class9a.school"
						required
						disabled={isLoading}
					/>

					<FireInput
						label="Password"
						value={activeTab === 'login' ? signin.password : signup.password}
						onChange={(e) =>
							activeTab === 'login'
								? setSignin((s) => ({ ...s, password: e.target.value }))
								: setSignup((s) => ({ ...s, password: e.target.value }))
						}
						type="password"
						placeholder="your secret key"
						showPasswordToggle
						required
						disabled={isLoading}
					/>

					<div className="flex items-center justify-between gap-4">
						<FireButton
							type="submit"
							loading={isLoading}
							className="flex-1"
							disabled={isLoading}
						>
							{activeTab === 'login' ? 'Sign In' : 'Create Account'}
						</FireButton>

						{activeTab === 'login' && (
							<button
								type="button"
								onClick={handleForgot}
								disabled={isLoading}
								className="text-sm text-neutral-500 dark:text-neutral-300 hover:text-[#ff3e00] transition-colors duration-200 px-2 py-1 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Forgot?
							</button>
						)}
					</div>

					<div className="text-xs text-neutral-500 dark:text-neutral-300 text-center mt-4 p-4 bg-neutral-50/80 dark:bg-neutral-800/60 rounded-t-lg border border-neutral-100 dark:border-neutral-700">
						{activeTab === 'signup' ? (
							<span>
								By creating an account you agree to be kind and keep the chat chill.
							</span>
						) : (
							<span>
								If your email isn&apos;t verified, we&apos;ll send you a new verification
								link when you try to sign in.
							</span>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
