import type { User as FirebaseUser } from 'firebase/auth';

import { FireProfile } from '@/app/lib/types';

/**
 * Unified auth state machine.
 * These states represent all possible auth scenarios in the app.
 */
export enum AuthState {
	LOADING = 'LOADING',
	UNAUTHENTICATED = 'UNAUTHENTICATED',
	UNVERIFIED = 'UNVERIFIED',
	NEW_USER = 'NEW_USER',
	BANNED = 'BANNED',
	NOT_ONBOARDED = 'NOT_ONBOARDED',
	AUTHENTICATED = 'AUTHENTICATED',
}

export function computeAuthState(
	firebaseUser: FirebaseUser | null,
	profile: FireProfile | null,
	isAuthLoading: boolean,
	isProfileLoading: boolean
): AuthState {
	// Still loading either hook
	if (isAuthLoading || isProfileLoading) {
		return AuthState.LOADING;
	}

	// No Firebase user = logged out
	if (!firebaseUser) {
		return AuthState.UNAUTHENTICATED;
	}

	// Email/password users must verify email
	const isEmailPassword = firebaseUser.providerData.some((p) => p.providerId === 'password');
	if (isEmailPassword && !firebaseUser.emailVerified) {
		return AuthState.UNVERIFIED;
	}

	// No profile = new user (never onboarded)
	if (!profile?.uid) {
		return AuthState.NEW_USER;
	}

	// User is banned
	if (profile.isBanned === true) {
		return AuthState.BANNED;
	}

	// User hasn't completed onboarding
	if (profile.onboarded !== true) {
		return AuthState.NOT_ONBOARDED;
	}

	// Fully authenticated
	return AuthState.AUTHENTICATED;
}

/**
 * Helper: Check if path is public (no auth required).
 */
export function isPublicPath(pathname: string): boolean {
	const publicPaths = ['/', '/fireup'];
	return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/**
 * Helper: Check if path is part of auth flow (signup/email-verify).
 */
export function isAuthFlowPath(pathname: string): boolean {
	return pathname === '/fireup' || pathname === '/onboard';
}
