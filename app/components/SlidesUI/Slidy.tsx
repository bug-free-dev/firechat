'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import { Launchy } from '@/app/components/SlidesUI/Launchy';
import { Moody } from '@/app/components/SlidesUI/Moody';
import { Namey } from '@/app/components/SlidesUI/Namey';
import { Picky } from '@/app/components/SlidesUI/Picky';
import { Quirky } from '@/app/components/SlidesUI/Quirky';
import { Sneaky } from '@/app/components/SlidesUI/Sneaky';
import { Taggy } from '@/app/components/SlidesUI/Taggy';
import { FireHeader } from '@/app/components/UI/FireHeader';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import { launchUserProfile } from '@/app/lib/utils/launch';
import { Memory } from '@/app/lib/utils/storage';

import {
	MESSAGES,
	ProfileDraft,
	Step,
	STEPS,
	validateMood,
	validateProfile,
	validateQuirks,
	validateSecret,
	validateTags,
	validateUsername,
	ValidationResult,
} from './utils';

export default function Slidy() {
	const { firebaseUser, refreshProfile } = useAuthState();

	const [current, setCurrent] = useState(0);
	const [nickname, setNickname] = useState('');
	const [displayName, setDisplayName] = useState('');
	const [secret, setSecret] = useState('');
	const [mood, setMood] = useState<string | null>(null);
	const [quirks, setQuirks] = useState<string[]>([]);
	const [tags, setTags] = useState<string[]>([]);
	const [profile, setProfile] = useState<ProfileDraft>({ avatarUrl: '', status: '', about: '' });

	const [checkingUsername, setCheckingUsername] = useState(false);
	const [checkingIdentifier, setCheckingIdentifier] = useState(false);
	const [loadingLaunch, setLoadingLaunch] = useState(false);

	/* <------- INITIALIZATION -------> */

	/**
	 * Load cached user data from Memory API
	 */
	useEffect(() => {
		// Retrieve cached data from Memory API
		const cachedDisplayName = Memory.get<string>('firechat:user:displayName');
		const cachedAvatarUrl = Memory.get<string>('firechat:user:avatarUrl');

		// Fallback chain: Memory cache → Firebase user → defaults
		const finalDisplayName = cachedDisplayName || firebaseUser?.displayName || '';
		const finalAvatarUrl = cachedAvatarUrl || firebaseUser?.photoURL || '';

		if (finalDisplayName) {
			setDisplayName(finalDisplayName);
		}

		if (finalAvatarUrl) {
			setProfile((prev) => ({ ...prev, avatarUrl: finalAvatarUrl }));
		}
	}, [firebaseUser]);

	/**
	 * Master validation function
	 */
	const validateStep = useCallback(
		async (stepId: Step): Promise<ValidationResult> => {
			switch (stepId) {
				case 'namey':
					return validateUsername(nickname, setCheckingUsername);
				case 'sneaky':
					return validateSecret(secret, setCheckingIdentifier);
				case 'moody':
					return validateMood(mood);
				case 'quirky':
					return validateQuirks(quirks);
				case 'taggy':
					return validateTags(tags);
				case 'picky':
					return validateProfile(profile);
				default:
					return { ok: true };
			}
		},
		[nickname, secret, mood, quirks, tags, profile]
	);

	/* <------- NAVIGATION -------> */

	const goNext = useCallback(async () => {
		const stepId = STEPS[current].id;
		const result = await validateStep(stepId);

		if (!result.ok) {
			toast.error(result.message ?? 'Validation failed');
			return;
		}

		if (result.message) {
			toast.success(result.message);
		}

		if (current < STEPS.length - 1) {
			setCurrent((prev) => prev + 1);
		}
	}, [current, validateStep]);

	const goBack = useCallback(() => {
		setCurrent((prev) => Math.max(0, prev - 1));
	}, []);

	/* <------- LAUNCH HANDLER -------> */

	const handleLaunch = useCallback(async () => {
		setLoadingLaunch(true);

		try {
			if (!firebaseUser) {
				toast.error(MESSAGES.ERROR.SIGNED_OUT);
				setLoadingLaunch(false);
				return;
			}

			// Build final payload
			const finalDisplayName = displayName || firebaseUser.displayName || nickname || 'new_user';
			const finalAvatarUrl = profile.avatarUrl || firebaseUser.photoURL || null;

			const payload = {
				displayName: finalDisplayName,
				usernamey: nickname.trim(),
				identifierKey: secret.trim(),
				mood,
				quirks,
				tags,
				status: profile.status?.trim() ?? '',
				about: profile.about?.trim() ?? '',
				avatarUrl: finalAvatarUrl,
			};

			// Submit to server
			const response = await launchUserProfile(firebaseUser.uid, payload);

			if (response.success) {
				toast.success(MESSAGES.SUCCESS.LAUNCH);

				// Clear cached data
				Memory.clearAll();

				// Refresh profile to trigger redirect
				await refreshProfile();
			} else {
				if (response.reason === 'USERNAME_TAKEN') {
					toast.error(MESSAGES.ERROR.USERNAME_TAKEN);
					setCurrent(0);
				} else {
					toast.error(MESSAGES.ERROR.LAUNCH_FAILED);
				}
			}
		} catch {
			toast.error(MESSAGES.ERROR.LAUNCH_UNEXPECTED);
		} finally {
			setLoadingLaunch(false);
		}
	}, [nickname, secret, mood, quirks, tags, profile, displayName, firebaseUser, refreshProfile]);

	/* <------- RENDER SLIDE -------> */

	const renderSlide = useCallback(() => {
		const stepId = STEPS[current].id;
		const stepIndex = current + 1;
		const total = STEPS.length;

		switch (stepId) {
			case 'namey':
				return <Namey value={nickname} onChange={setNickname} step={stepIndex} total={total} />;

			case 'sneaky':
				return <Sneaky value={secret} onChange={setSecret} step={stepIndex} total={total} />;

			case 'moody':
				return (
					<Moody
						value={mood ?? ''}
						onChange={(v) => setMood(v || null)}
						step={stepIndex}
						total={total}
					/>
				);

			case 'quirky':
				return <Quirky value={quirks} onChange={setQuirks} step={stepIndex} total={total} />;

			case 'taggy':
				return <Taggy value={tags} onChange={setTags} step={stepIndex} total={total} />;

			case 'picky':
				return <Picky value={profile} onChange={setProfile} step={stepIndex} total={total} />;

			case 'launchy':
				return (
					<Launchy
						step={stepIndex}
						total={total}
						onLaunch={handleLaunch}
						loading={loadingLaunch}
						preview={{
							displayName: displayName || nickname,
							usernamey: nickname,
							mood,
							quirks,
							tags,
							status: profile.status,
							about: profile.about,
							identifierKey: secret,
							avatarUrl: profile.avatarUrl ?? undefined,
						}}
					/>
				);

			default:
				return null;
		}
	}, [
		current,
		nickname,
		secret,
		mood,
		quirks,
		tags,
		profile,
		displayName,
		loadingLaunch,
		handleLaunch,
	]);

	/* <------- COMPUTED VALUES -------> */

	const isNavigationDisabled = checkingUsername || checkingIdentifier || loadingLaunch;
	const isBackDisabled = current === 0 || isNavigationDisabled;
	const isNextDisabled = isNavigationDisabled || current === STEPS.length - 1;

	/* <------- KEYBOARD NAVIGATION -------> */
	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (isNavigationDisabled) return;

			switch (e.key) {
				case 'Enter':
				case 'ArrowRight':
					await goNext();
					break;
				case 'ArrowLeft':
					goBack();
					break;
				default:
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [goNext, goBack, isNavigationDisabled]);

	/* <------- RENDER -------> */

	return (
		<div className="min-h-screen flex flex-col bg-white">
			<FireHeader />

			<main className="flex-1 flex items-center justify-center">{renderSlide()}</main>

			<footer className="w-full flex justify-center items-center gap-6 py-4 border-t border-neutral-200 bg-white">
				<button
					onClick={goBack}
					disabled={isBackDisabled}
					className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-neutral-200 shadow-sm hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Previous step"
				>
					<FaArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
				</button>

				<span className="text-sm md:text-base text-neutral-500 font-medium select-none">
					{current + 1} / {STEPS.length}
				</span>

				{current < STEPS.length - 1 && (
					<button
						onClick={goNext}
						disabled={isNextDisabled}
						className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#ff9b58] shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Next step"
					>
						<FaArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
					</button>
				)}

				{current === STEPS.length - 1 && (
					<div className="w-10 h-10 md:w-12 md:h-12" aria-hidden="true" />
				)}
			</footer>
		</div>
	);
}
