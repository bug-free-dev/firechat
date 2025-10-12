'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

import {
	deleteAccount as deleteAccountAPI,
	getMinimalProfileFromIdToken,
} from '@/app/lib/api/userAPI';
import { auth } from '@/app/lib/firebase/FireClient';
import type { FireProfile } from '@/app/lib/types';
import {
	signOutUser,
	registerWithEmail,
	sendVerificationToUser,
	signInWithEmail,
	signInWithGoogle,
	signInWithGithub,
	updateAuthProfile,
} from '@/app/lib/utils/auth';
import { verifyIdentifierKeyAsync } from '@/app/lib/utils/hashy';
import { normalizeProfile } from '@/app/lib/utils/sanitizer';
import { Memory } from '@/app/lib/utils/cachy';
import { AuthState, computeAuthState, isAuthFlowPath, isPublicPath } from '../util/helper';

/**
 * UNIFIED AUTH CONTEXT - SINGLE SOURCE OF TRUTH
 *
 * This context handles:
 * - Firebase authentication state
 * - User profile fetching (ONCE per auth change)
 * - Auth actions (login, logout, signup)
 * - Profile actions (update, verify identifier)
 * - Automatic routing based on auth state
 */

interface AuthContextValue {
	// State
	authState: AuthState;
	firebaseUser: FirebaseUser | null;
	profile: FireProfile | null;
	isLoading: boolean;
	error: string | null;

	// Auth Actions
	signUp: (
		displayName: string,
		email: string,
		password: string
	) => Promise<{ ok: boolean; error?: string }>;
	signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
	signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
	signInWithGithub: () => Promise<{ ok: boolean; error?: string }>;
	logout: () => Promise<void>;
	deleteAndLogout: () => Promise<void>;

	// Profile Actions
	refreshProfile: () => Promise<void>;
	updateProfile: (updates: Partial<FireProfile>) => Promise<boolean>;
	verifyIdentifier: (input: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MEMORY_KEYS = {
	DISPLAY_NAME: 'firechat:user:displayName',
	AVATAR_URL: 'firechat:user:avatarUrl',
	EMAIL: 'firechat:user:email',
} as const;

const PROFILE_CACHE_TTL = 5 * 60 * 1000;

interface ProfileCache {
	profile: FireProfile;
	timestamp: number;
}

const profileCache = new Map<string, ProfileCache>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	// Core state
	const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
	const [profile, setProfile] = useState<FireProfile | null>(null);
	const [authState, setAuthState] = useState<AuthState>(AuthState.LOADING);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Refs for cleanup and race condition prevention
	const mountedRef = useRef(true);
	const fetchControllerRef = useRef<AbortController | null>(null);
	const redirectInProgressRef = useRef(false);
	const lastProfileFetchRef = useRef<number>(0);

	/**
	 * Cache user data for onboarding flow
	 */
	const cacheUserData = useCallback((fbUser: FirebaseUser): void => {
		if (fbUser.displayName) Memory.set(MEMORY_KEYS.DISPLAY_NAME, fbUser.displayName);
		if (fbUser.photoURL) Memory.set(MEMORY_KEYS.AVATAR_URL, fbUser.photoURL);
		if (fbUser.email) Memory.set(MEMORY_KEYS.EMAIL, fbUser.email);
	}, []);

	/**
	 * Clear all cached user data
	 */
	const clearUserCache = useCallback((): void => {
		Object.values(MEMORY_KEYS).forEach((key) => Memory.remove(key));
		profileCache.clear();
	}, []);

	/**
	 * Fetch profile with caching and abort control
	 * This is the ONLY place profile fetching happens
	 */
	const fetchProfile = useCallback(
		async (fbUser: FirebaseUser, forceRefresh = false): Promise<FireProfile | null> => {
			if (!mountedRef.current) return null;

			const now = Date.now();
			const uid = fbUser.uid;

			// Check cache (unless forcing refresh)
			if (!forceRefresh) {
				const cached = profileCache.get(uid);
				if (cached && now - cached.timestamp < PROFILE_CACHE_TTL) {
					return cached.profile;
				}
			}

			// Prevent rapid successive fetches
			const timeSinceLastFetch = now - lastProfileFetchRef.current;
			if (!forceRefresh && timeSinceLastFetch < 500) {
				return profile; // Return current profile if fetched recently
			}

			// Abort previous fetch
			if (fetchControllerRef.current) {
				fetchControllerRef.current.abort();
			}

			const controller = new AbortController();
			fetchControllerRef.current = controller;
			lastProfileFetchRef.current = now;

			try {
				const idToken = await fbUser.getIdToken(forceRefresh);

				if (controller.signal.aborted || !mountedRef.current) {
					return null;
				}

				const data = await getMinimalProfileFromIdToken(idToken);

				if (controller.signal.aborted || !mountedRef.current) {
					return null;
				}

				// New user - no profile yet
				if (!data?.uid) {
					return null;
				}

				const normalized = normalizeProfile(data);

				// Update cache
				profileCache.set(uid, {
					profile: normalized,
					timestamp: now,
				});

				return normalized;
			} catch (err) {
				if (err instanceof Error && err.name === 'AbortError') {
					return null;
				}
				setError('Failed to load profile');
				return null;
			} finally {
				if (fetchControllerRef.current === controller) {
					fetchControllerRef.current = null;
				}
			}
		},
		[profile]
	);

	/**
	 * Firebase auth state listener
	 * This is the ONLY place that orchestrates auth + profile fetching
	 */
	useEffect(() => {
		mountedRef.current = true;

		const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
			if (!mountedRef.current) return;

			setIsLoading(true);
			setFirebaseUser(fbUser);

			if (!fbUser) {
				// User logged out
				setProfile(null);
				setAuthState(AuthState.UNAUTHENTICATED);
				setError(null);
				setIsLoading(false);
				return;
			}

			// User logged in - fetch profile
			try {
				const fetchedProfile = await fetchProfile(fbUser);

				if (!mountedRef.current) return;

				setProfile(fetchedProfile);
				setError(null);
			} catch {
				setError('Authentication error');
			} finally {
				if (mountedRef.current) {
					setIsLoading(false);
				}
			}
		});

		return () => {
			mountedRef.current = false;
			if (fetchControllerRef.current) {
				fetchControllerRef.current.abort();
			}
			unsubscribe();
		};
	}, [fetchProfile]);

	/**
	 * Compute unified auth state whenever firebase user or profile changes
	 */
	useEffect(() => {
		if (isLoading) return;

		const newState = computeAuthState(
			firebaseUser,
			profile,
			false, // auth not loading
			false // profile not loading
		);

		setAuthState(newState);
	}, [firebaseUser, profile, isLoading]);

	/**
	 * Reactive redirect logic based on auth state
	 */
	useEffect(() => {
		if (authState === AuthState.LOADING || redirectInProgressRef.current) return;

		const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
		let targetPath: string | null = null;

		switch (authState) {
			case AuthState.UNAUTHENTICATED:
				if (!isPublicPath(pathname)) {
					targetPath = '/fireup';
				}
				break;

			case AuthState.UNVERIFIED:
				if (pathname !== '/fireup') {
					targetPath = '/fireup';
				}
				break;

			case AuthState.BANNED:
				if (pathname !== '/') {
					targetPath = '/';
				}
				break;

			case AuthState.NEW_USER:
			case AuthState.NOT_ONBOARDED:
				if (pathname !== '/onboard') {
					targetPath = '/onboard';
				}
				break;

			case AuthState.AUTHENTICATED:
				if (isAuthFlowPath(pathname)) {
					targetPath = '/desk';
				}
				break;

			default:
				break;
		}

		if (targetPath) {
			redirectInProgressRef.current = true;
			router.push(targetPath);
			setTimeout(() => {
				redirectInProgressRef.current = false;
			}, 100);
		}
	}, [authState, router]);

	/**
	 * Sign up new user
	 */
	const signUp = useCallback(
		async (
			displayName: string,
			email: string,
			password: string
		): Promise<{ ok: boolean; error?: string }> => {
			setIsLoading(true);

			try {
				const result = await registerWithEmail(email.trim(), password);

				if (!result.ok) {
					setIsLoading(false);
					return { ok: false, error: result.error?.message || 'Sign-up failed' };
				}

				const user = result.data.user;

				if (displayName.trim()) {
					await updateAuthProfile(user, { displayName: displayName.trim() });
				}

				const verificationResult = await sendVerificationToUser(user).catch(() => ({
					ok: false,
				}));

				if (!verificationResult?.ok) {
					await signOutUser().catch(() => {});
					setIsLoading(false);
					return { ok: false, error: 'Failed to send verification email' };
				}

				cacheUserData(user);
				await signOutUser().catch(() => {});

				setIsLoading(false);
				return { ok: true };
			} catch (err) {
				setIsLoading(false);
				return {
					ok: false,
					error: err instanceof Error ? err.message : 'Sign-up failed',
				};
			}
		},
		[cacheUserData]
	);

	/**
	 * Sign in existing user
	 */
	const signIn = useCallback(
		async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
			setIsLoading(true);

			try {
				const result = await signInWithEmail(email.trim(), password);

				if (!result.ok) {
					setIsLoading(false);
					return { ok: false, error: result.error?.message || 'Sign-in failed' };
				}

				const fbUser = result.data.user;

				if (!fbUser.emailVerified) {
					await sendVerificationToUser(fbUser).catch(() => {});
					await signOutUser().catch(() => {});
					setIsLoading(false);
					return {
						ok: false,
						error: 'Email not verified. Check your inbox.',
					};
				}

				// Auth listener will handle profile fetch
				return { ok: true };
			} catch (err) {
				setIsLoading(false);
				return {
					ok: false,
					error: err instanceof Error ? err.message : 'Sign-in failed',
				};
			}
		},
		[]
	);

	/**
	 * Google OAuth sign-in
	 */
	const signInWithGoogleProvider = useCallback(async (): Promise<{
		ok: boolean;
		error?: string;
	}> => {
		setIsLoading(true);

		try {
			const result = await signInWithGoogle();

			if (!result.ok) {
				setIsLoading(false);
				return { ok: false, error: result.error?.message || 'Google sign-in failed' };
			}

			// Auth listener will handle profile fetch
			return { ok: true };
		} catch (err) {
			setIsLoading(false);
			return {
				ok: false,
				error: err instanceof Error ? err.message : 'Google sign-in failed',
			};
		}
	}, []);

	/**
	 * GitHub OAuth sign-in
	 */
	const signInWithGithubProvider = useCallback(async (): Promise<{
		ok: boolean;
		error?: string;
	}> => {
		setIsLoading(true);

		try {
			const result = await signInWithGithub();

			if (!result.ok) {
				setIsLoading(false);
				return { ok: false, error: result.error?.message || 'GitHub sign-in failed' };
			}

			// Auth listener will handle profile fetch
			return { ok: true };
		} catch (err) {
			setIsLoading(false);
			return {
				ok: false,
				error: err instanceof Error ? err.message : 'GitHub sign-in failed',
			};
		}
	}, []);

	/**
	 * Logout user
	 */
	const logout = useCallback(async (): Promise<void> => {
		try {
			if (fetchControllerRef.current) {
				fetchControllerRef.current.abort();
			}

			clearUserCache();
			await signOutUser();
		} catch {
			/** Ignore */
		}
	}, [clearUserCache]);

	/**
	 * Delete account and logout
	 */
	const deleteAndLogout = useCallback(async (): Promise<void> => {
		try {
			if (!profile?.uid) {
				throw new Error('No profile to delete');
			}

			const success = await deleteAccountAPI(profile.uid);
			if (!success) {
				throw new Error('Account deletion failed');
			}

			await logout();
		} catch (err) {
			throw err;
		}
	}, [profile, logout]);

	/**
	 * Refresh profile from server
	 */
	const refreshProfile = useCallback(async (): Promise<void> => {
		if (!firebaseUser || !mountedRef.current) return;

		setIsLoading(true);
		const fetchedProfile = await fetchProfile(firebaseUser, true);

		if (mountedRef.current) {
			setProfile(fetchedProfile);
			setIsLoading(false);
		}
	}, [firebaseUser, fetchProfile]);

	/**
	 * Update profile
	 */
	const updateProfile = useCallback(
		async (updates: Partial<FireProfile>): Promise<boolean> => {
			if (!profile?.uid) return false;

			try {
				const { updateUserProfile } = await import('@/app/lib/api/userAPI');
				const success = await updateUserProfile(profile.uid, updates);

				if (success && mountedRef.current) {
					const updated = normalizeProfile({ ...profile, ...updates });
					setProfile(updated);

					// Update cache
					profileCache.set(profile.uid, {
						profile: updated,
						timestamp: Date.now(),
					});
				}

				return success;
			} catch {
				return false;
			}
		},
		[profile]
	);

	/**
	 * Verify identifier key
	 */
	const verifyIdentifier = useCallback(
		async (input: string): Promise<boolean> => {
			if (!profile?.identifierKey) return false;

			try {
				return await verifyIdentifierKeyAsync(input, profile.identifierKey);
			} catch {
				return false;
			}
		},
		[profile]
	);

	const value: AuthContextValue = {
		authState,
		firebaseUser,
		profile,
		isLoading,
		error,
		signUp,
		signIn,
		signInWithGoogle: signInWithGoogleProvider,
		signInWithGithub: signInWithGithubProvider,
		logout,
		deleteAndLogout,
		refreshProfile,
		updateProfile,
		verifyIdentifier,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access unified auth context
 */
export function useAuthState(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuthState must be used inside AuthProvider');
	}
	return ctx;
}
