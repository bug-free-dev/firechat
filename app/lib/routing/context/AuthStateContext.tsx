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
import { normalizeProfile } from '@/app/lib/utils/sanitizer';

import { AuthState, computeAuthState, isAuthFlowPath, isPublicPath } from '../util/helper';

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

const MEMORY_KEYS = {
	DISPLAY_NAME: 'firechat:user:displayName',
	AVATAR_URL: 'firechat:user:avatarUrl',
	EMAIL: 'firechat:user:email',
} as const;

const PROFILE_CACHE_TTL = 5 * 60 * 1000;
const MIN_FETCH_INTERVAL = 500;
const REDIRECT_DEBOUNCE = 100;

interface ProfileCache {
	profile: FireProfile;
	timestamp: number;
}

const profileCache = new Map<string, ProfileCache>();

const normalizeProfileMemoized = (() => {
	const cache = new WeakMap<Partial<FireProfile>, FireProfile>();
	return (data: Partial<FireProfile>): FireProfile => {
		const cached = cache.get(data);
		if (cached) return cached;
		const normalized = normalizeProfile(data);
		cache.set(data, normalized);
		return normalized;
	};
})();

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
	const [profile, setProfile] = useState<FireProfile | null>(null);
	const [authState, setAuthState] = useState<AuthState>(AuthState.LOADING);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const mountedRef = useRef(true);
	const fetchControllerRef = useRef<AbortController | null>(null);
	const redirectInProgressRef = useRef(false);
	const lastProfileFetchRef = useRef(0);
	const lastAuthStateRef = useRef<AuthState>(AuthState.LOADING);
	const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const cacheUserData = useCallback((fbUser: FirebaseUser): void => {
		const batch: Array<[string, string]> = [];
		if (fbUser.displayName) batch.push([MEMORY_KEYS.DISPLAY_NAME, fbUser.displayName]);
		if (fbUser.photoURL) batch.push([MEMORY_KEYS.AVATAR_URL, fbUser.photoURL]);
		if (fbUser.email) batch.push([MEMORY_KEYS.EMAIL, fbUser.email]);
		batch.forEach(([key, value]) => Memory.set(key, value));
	}, []);

	const clearUserCache = useCallback((): void => {
		Memory.clearAll();
		profileCache.clear();
	}, []);

	const fetchProfile = useCallback(
		async (fbUser: FirebaseUser, forceRefresh = false): Promise<FireProfile | null> => {
			if (!mountedRef.current) return null;

			const now = Date.now();
			const uid = fbUser.uid;

			if (!forceRefresh) {
				const cached = profileCache.get(uid);
				if (cached && now - cached.timestamp < PROFILE_CACHE_TTL) {
					return cached.profile;
				}

				const timeSinceLastFetch = now - lastProfileFetchRef.current;
				if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
					return profile;
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

				if (controller.signal.aborted || !mountedRef.current) {
					return null;
				}

				const data = await getMinimalProfileFromIdToken(idToken);

				if (controller.signal.aborted || !mountedRef.current) {
					return null;
				}

				if (!data?.uid) {
					return null;
				}

				const normalized = normalizeProfileMemoized(data);

				profileCache.set(uid, {
					profile: normalized,
					timestamp: now,
				});

				return normalized;
			} catch (err) {
				if (err instanceof Error && err.name === 'AbortError') {
					return null;
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
		[profile]
	);

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

				if (!mountedRef.current) return;

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
			if (redirectTimeoutRef.current) {
				clearTimeout(redirectTimeoutRef.current);
			}
			unsubscribe();
		};
	}, [fetchProfile]);

	useEffect(() => {
		if (isLoading) return;

		const newState = computeAuthState(firebaseUser, profile, false, false);

		if (newState !== lastAuthStateRef.current) {
			lastAuthStateRef.current = newState;
			setAuthState(newState);
		}
	}, [firebaseUser, profile, isLoading]);

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

			if (redirectTimeoutRef.current) {
				clearTimeout(redirectTimeoutRef.current);
			}

			redirectTimeoutRef.current = setTimeout(() => {
				redirectInProgressRef.current = false;
				redirectTimeoutRef.current = null;
			}, REDIRECT_DEBOUNCE);
		}
	}, [authState, router]);

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
					return { ok: false, error: result.error?.message ?? 'Sign-up failed' };
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

	const signIn = useCallback(
		async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
			setIsLoading(true);

			try {
				const result = await signInWithEmail(email.trim(), password);

				if (!result.ok) {
					setIsLoading(false);
					return { ok: false, error: result.error?.message ?? 'Sign-in failed' };
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

	const signInWithGoogleProvider = useCallback(async (): Promise<{
		ok: boolean;
		error?: string;
	}> => {
		setIsLoading(true);

		try {
			const result = await signInWithGoogle();

			if (!result.ok) {
				setIsLoading(false);
				return { ok: false, error: result.error?.message ?? 'Google sign-in failed' };
			}

			return { ok: true };
		} catch (err) {
			setIsLoading(false);
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
		setIsLoading(true);

		try {
			const result = await signInWithGithub();

			if (!result.ok) {
				setIsLoading(false);
				return { ok: false, error: result.error?.message ?? 'GitHub sign-in failed' };
			}

			return { ok: true };
		} catch (err) {
			setIsLoading(false);
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
		if (!profile?.uid) {
			throw new Error('No profile to delete');
		}

		const success = await deleteAccountAPI(profile.uid);
		if (!success) {
			throw new Error('Account deletion failed');
		}

		await logout();
	}, [profile, logout]);

	const refreshProfile = useCallback(async (): Promise<void> => {
		if (!firebaseUser || !mountedRef.current) return;

		setIsLoading(true);
		const fetchedProfile = await fetchProfile(firebaseUser, true);

		if (mountedRef.current) {
			setProfile(fetchedProfile);
			setIsLoading(false);
		}
	}, [firebaseUser, fetchProfile]);

	const updateProfile = useCallback(
		async (updates: Partial<FireProfile>): Promise<boolean> => {
			if (!profile?.uid) return false;

			try {
				const success = await updateUserProfileAPI(profile.uid, updates);

				if (success && mountedRef.current) {
					const updated = normalizeProfileMemoized({ ...profile, ...updates });
					setProfile(updated);

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

	const value = useMemo<AuthContextValue>(
		() => ({
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
		}),
		[
			authState,
			firebaseUser,
			profile,
			isLoading,
			error,
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

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthState(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuthState must be used inside AuthProvider');
	}
	return ctx;
}
