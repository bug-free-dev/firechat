'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import {
	deleteAccount as deleteAccountAPI,
	getMinimalProfileFromIdToken,
	updateUserProfile as updateUserProfileAPI,
} from '@/app/lib/api/userAPI';
import { auth } from '@/app/lib/firebase/FireClient';
import type { FireProfile } from '@/app/lib/types';
import {
	registerWithEmail,
	sendVerificationToUser,
	signInWithEmail,
	signInWithGithub,
	signInWithGoogle,
	signOutUser,
	updateAuthProfile,
} from '@/app/lib/utils/auth';
import { verifyIdentifierKeyAsync } from '@/app/lib/utils/hashy';
import { Memory } from '@/app/lib/utils/localStorage';

import { AuthState, computeAuthState, isAuthFlowPath } from '../helpers/compute';
import {
	batchMemorySet,
	normalizeProfileMemoized,
	profileCache,
	setProfileCache,
} from '../helpers/ctxHelpers';

interface AuthContextValue {
	authState: AuthState;
	firebaseUser: FirebaseUser | null;
	profile: FireProfile | null;
	isLoading: boolean;
	error: string | null;
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
	refreshProfile: () => Promise<void>;
	updateProfile: (updates: Partial<FireProfile>) => Promise<boolean>;
	verifyIdentifier: (input: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const MEMORY_KEYS = {
	DISPLAY_NAME: 'firechat:user:displayName',
	AVATAR_URL: 'firechat:user:avatarUrl',
	EMAIL: 'firechat:user:email',
} as const;

export const PROFILE_CACHE_TTL = 5 * 60 * 1000;
export const MIN_FETCH_INTERVAL = 500;
export const RETRY_ATTEMPTS = 2;
export const RETRY_DELAY = 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
	const [profile, setProfile] = useState<FireProfile | null>(null);
	const [authState, setAuthState] = useState<AuthState>(AuthState.LOADING);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const mountedRef = useRef(true);
	const fetchControllerRef = useRef<AbortController | null>(null);
	const lastProfileFetchRef = useRef(0);
	const lastAuthStateRef = useRef<AuthState>(AuthState.LOADING);
	const profileRef = useRef<FireProfile | null>(null);
	const firebaseUserRef = useRef<FirebaseUser | null>(null);

	const cacheUserData = useCallback((fbUser: FirebaseUser): void => {
		const batch: Array<[string, string]> = [];
		if (fbUser.displayName) batch.push([MEMORY_KEYS.DISPLAY_NAME, fbUser.displayName]);
		if (fbUser.photoURL) batch.push([MEMORY_KEYS.AVATAR_URL, fbUser.photoURL]);
		if (fbUser.email) batch.push([MEMORY_KEYS.EMAIL, fbUser.email]);
		if (batch.length > 0) batchMemorySet(batch);
	}, []);

	const clearUserCache = useCallback((): void => {
		Memory.clearAll();
		profileCache.clear();
	}, []);

	const fetchProfile = useCallback(
		async (
			fbUser: FirebaseUser,
			forceRefresh = false,
			retries = RETRY_ATTEMPTS
		): Promise<FireProfile | null> => {
			if (!mountedRef.current) return null;

			const now = Date.now();
			const uid = fbUser.uid;

			// Fast path: return cached profile if valid
			if (!forceRefresh) {
				const cached = profileCache.get(uid);
				if (cached && now - cached.timestamp < PROFILE_CACHE_TTL) {
					return cached.profile;
				}

				// Debounce rapid fetches
				const timeSinceLastFetch = now - lastProfileFetchRef.current;
				if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
					return profileRef.current;
				}
			}

			if (fetchControllerRef.current) {
				fetchControllerRef.current.abort();
			}

			const controller = new AbortController();
			fetchControllerRef.current = controller;
			lastProfileFetchRef.current = now;

			try {
				const idToken = await fbUser.getIdToken(forceRefresh);

				// Early exit if aborted or unmounted
				if (controller.signal.aborted || !mountedRef.current) {
					return null;
				}

				const data = await getMinimalProfileFromIdToken(idToken);

				// Race condition check: ensure user hasn't changed
				if (
					controller.signal.aborted ||
					!mountedRef.current ||
					firebaseUserRef.current?.uid !== fbUser.uid
				) {
					return null;
				}

				if (!data?.uid) {
					return null;
				}

				const normalized = normalizeProfileMemoized(data);

				// Update cache
				setProfileCache(uid, {
					profile: normalized,
					timestamp: now,
				});

				return normalized;
			} catch (err) {
				// Don't retry aborted requests
				if (err instanceof Error && err.name === 'AbortError') {
					return null;
				}

				// Retry logic with exponential backoff
				if (retries > 0 && mountedRef.current) {
					await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
					return fetchProfile(fbUser, forceRefresh, retries - 1);
				}

				if (mountedRef.current) {
					setError('Failed to load profile');
				}
				return null;
			} finally {
				if (fetchControllerRef.current === controller) {
					fetchControllerRef.current = null;
				}
			}
		},
		[]
	);

	// Sync refs immediately for fast access
	useEffect(() => {
		profileRef.current = profile;
	}, [profile]);

	useEffect(() => {
		firebaseUserRef.current = firebaseUser;
	}, [firebaseUser]);

	// Main auth state listener
	useEffect(() => {
		mountedRef.current = true;

		const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
			if (!mountedRef.current) return;

			setIsLoading(true);
			setFirebaseUser(fbUser);

			if (!fbUser) {
				setProfile(null);
				setAuthState(AuthState.UNAUTHENTICATED);
				setError(null);
				setIsLoading(false);
				return;
			}

			try {
				const fetchedProfile = await fetchProfile(fbUser);

				// Double-check user hasn't changed during fetch
				if (!mountedRef.current || firebaseUserRef.current?.uid !== fbUser.uid) {
					return;
				}

				setProfile(fetchedProfile);
				setError(null);
			} catch {
				if (mountedRef.current) {
					setError('Authentication error');
				}
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

	// Compute auth state
	useEffect(() => {
		if (isLoading) return;

		const newState = computeAuthState(firebaseUser, profile, false, false);

		// Only update if changed (prevents unnecessary re-renders)
		if (newState !== lastAuthStateRef.current) {
			lastAuthStateRef.current = newState;
			setAuthState(newState);
		}
	}, [firebaseUser, profile, isLoading]);

	// Handle navigation
	useEffect(() => {
		if (authState === AuthState.LOADING) return;

		const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

		// Home page handles its own redirect
		if (pathname === '/') return;

		let targetPath: string | null = null;

		switch (authState) {
			case AuthState.UNAUTHENTICATED:
			case AuthState.UNVERIFIED:
				targetPath = '/fireup';
				break;

			case AuthState.BANNED:
				targetPath = '/';
				break;

			case AuthState.NEW_USER:
			case AuthState.NOT_ONBOARDED:
				if (pathname !== '/onboarding') {
					targetPath = '/onboarding';
				}
				break;

			case AuthState.AUTHENTICATED:
				if (isAuthFlowPath(pathname)) {
					targetPath = '/desk';
				}
				break;
		}

		if (targetPath) {
			router.push(targetPath);
		}
	}, [authState, router]);

	const signUp = useCallback(
		async (
			displayName: string,
			email: string,
			password: string
		): Promise<{ ok: boolean; error?: string }> => {
			if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

			setIsLoading(true);

			try {
				const result = await registerWithEmail(email.trim(), password);

				if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

				if (!result.ok) {
					if (mountedRef.current) setIsLoading(false);
					return { ok: false, error: result.error?.message ?? 'Sign-up failed' };
				}

				const user = result.data.user;

				if (displayName.trim()) {
					await updateAuthProfile(user, { displayName: displayName.trim() });
				}

				if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

				const verificationResult = await sendVerificationToUser(user).catch(() => ({
					ok: false,
				}));

				if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

				if (!verificationResult?.ok) {
					await signOutUser().catch(() => {});
					if (mountedRef.current) setIsLoading(false);
					return { ok: false, error: 'Failed to send verification email' };
				}

				cacheUserData(user);
				await signOutUser().catch(() => {});

				if (mountedRef.current) setIsLoading(false);
				return { ok: true };
			} catch (err) {
				if (mountedRef.current) setIsLoading(false);
				return {
					ok: false,
					error: err instanceof Error ? err.message : 'Sign-up failed',
				};
			}
		},
		[cacheUserData]
	);

	const signIn = useCallback(
		async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
			if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

			setIsLoading(true);

			try {
				const result = await signInWithEmail(email.trim(), password);

				if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

				if (!result.ok) {
					if (mountedRef.current) setIsLoading(false);
					return { ok: false, error: result.error?.message ?? 'Sign-in failed' };
				}

				const fbUser = result.data.user;

				if (!fbUser.emailVerified) {
					await sendVerificationToUser(fbUser).catch(() => {});
					await signOutUser().catch(() => {});
					if (mountedRef.current) setIsLoading(false);
					return {
						ok: false,
						error: 'Email not verified. Check your inbox.',
					};
				}

				return { ok: true };
			} catch (err) {
				if (mountedRef.current) setIsLoading(false);
				return {
					ok: false,
					error: err instanceof Error ? err.message : 'Sign-in failed',
				};
			}
		},
		[]
	);

	const signInWithGoogleProvider = useCallback(async (): Promise<{
		ok: boolean;
		error?: string;
	}> => {
		if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

		setIsLoading(true);

		try {
			const result = await signInWithGoogle();

			if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

			if (!result.ok) {
				if (mountedRef.current) setIsLoading(false);
				return { ok: false, error: result.error?.message ?? 'Google sign-in failed' };
			}

			return { ok: true };
		} catch (err) {
			if (mountedRef.current) setIsLoading(false);
			return {
				ok: false,
				error: err instanceof Error ? err.message : 'Google sign-in failed',
			};
		}
	}, []);

	const signInWithGithubProvider = useCallback(async (): Promise<{
		ok: boolean;
		error?: string;
	}> => {
		if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

		setIsLoading(true);

		try {
			const result = await signInWithGithub();

			if (!mountedRef.current) return { ok: false, error: 'Component unmounted' };

			if (!result.ok) {
				if (mountedRef.current) setIsLoading(false);
				return { ok: false, error: result.error?.message ?? 'GitHub sign-in failed' };
			}

			return { ok: true };
		} catch (err) {
			if (mountedRef.current) setIsLoading(false);
			return {
				ok: false,
				error: err instanceof Error ? err.message : 'GitHub sign-in failed',
			};
		}
	}, []);

	const logout = useCallback(async (): Promise<void> => {
		try {
			if (fetchControllerRef.current) {
				fetchControllerRef.current.abort();
			}

			clearUserCache();
			await signOutUser();
		} catch {
			// Ignore
		}
	}, [clearUserCache]);

	const deleteAndLogout = useCallback(async (): Promise<void> => {
		if (!profileRef.current?.uid) {
			throw new Error('No profile to delete');
		}

		const success = await deleteAccountAPI(profileRef.current.uid);
		if (!success) {
			throw new Error('Account deletion failed');
		}

		await logout();
	}, [logout]);

	const refreshProfile = useCallback(async (): Promise<void> => {
		const currentUser = firebaseUserRef.current;
		if (!currentUser || !mountedRef.current) return;

		setIsLoading(true);
		const fetchedProfile = await fetchProfile(currentUser, true);

		if (mountedRef.current && firebaseUserRef.current?.uid === currentUser.uid) {
			setProfile(fetchedProfile);
			setIsLoading(false);
		}
	}, [fetchProfile]);

	const updateProfile = useCallback(async (updates: Partial<FireProfile>): Promise<boolean> => {
		const currentProfile = profileRef.current;
		if (!currentProfile?.uid) return false;

		try {
			const success = await updateUserProfileAPI(currentProfile.uid, updates);

			if (success && mountedRef.current) {
				const updated = normalizeProfileMemoized({ ...currentProfile, ...updates });
				setProfile(updated);

				setProfileCache(currentProfile.uid, {
					profile: updated,
					timestamp: Date.now(),
				});
			}

			return success;
		} catch {
			return false;
		}
	}, []);

	const verifyIdentifier = useCallback(async (input: string): Promise<boolean> => {
		const currentProfile = profileRef.current;
		if (!currentProfile?.identifierKey) return false;

		try {
			return await verifyIdentifierKeyAsync(input, currentProfile.identifierKey);
		} catch {
			return false;
		}
	}, []);

	// Memoize methods separately to prevent context re-creation
	const staticMethods = useMemo(
		() => ({
			signUp,
			signIn,
			signInWithGoogle: signInWithGoogleProvider,
			signInWithGithub: signInWithGithubProvider,
			logout,
			deleteAndLogout,
			refreshProfile,
			updateProfile,
			verifyIdentifier,
		}),
		[
			signUp,
			signIn,
			signInWithGoogleProvider,
			signInWithGithubProvider,
			logout,
			deleteAndLogout,
			refreshProfile,
			updateProfile,
			verifyIdentifier,
		]
	);

	const value = useMemo<AuthContextValue>(
		() => ({
			...staticMethods,
			authState,
			firebaseUser,
			profile,
			isLoading,
			error,
		}),
		[staticMethods, authState, firebaseUser, profile, isLoading, error]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthState(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuthState must be used inside AuthProvider');
	}
	return ctx;
}
