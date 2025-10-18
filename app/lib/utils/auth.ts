import { FirebaseError } from 'firebase/app';
import {
	type AuthProvider,
	confirmPasswordReset,
	createUserWithEmailAndPassword,
	fetchSignInMethodsForEmail,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	signOut,
	updatePassword,
	updateProfile as fbUpdateProfile,
	type User,
	type UserCredential,
} from 'firebase/auth';

import { auth, githubProvider, googleProvider } from '@/app/lib/firebase/FireClient';

/**
 * Standardized return type for all utils
 */
type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/** Helper to normalize Firebase errors */
function wrapError(err: unknown) {
	if (err && typeof err === 'object') {
		const e = err as FirebaseError | { code?: string; message?: string };
		return {
			code: e.code ?? 'unknown',
			message: e instanceof FirebaseError ? e.message : (e.message ?? String(err)),
		};
	}
	return { code: 'unknown', message: String(err) };
}

/* ---------------------------
   Auth utility functions
   --------------------------- */

/**
 * Register user with email + password
 */
export async function registerWithEmail(
	email: string,
	password: string
): Promise<Result<UserCredential>> {
	try {
		const cred = await createUserWithEmailAndPassword(auth, email, password);
		return { ok: true, data: cred };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Sign in with email + password
 */
export async function signInWithEmail(
	email: string,
	password: string
): Promise<Result<UserCredential>> {
	try {
		const cred = await signInWithEmailAndPassword(auth, email, password);
		return { ok: true, data: cred };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Generic popup sign-in with given provider
 */
export async function signInWithProviderPopup(
	provider: AuthProvider
): Promise<Result<UserCredential>> {
	try {
		const cred = await signInWithPopup(auth, provider);
		return { ok: true, data: cred };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Sign-in using Google (popup)
 */
export async function signInWithGoogle(): Promise<Result<UserCredential>> {
	if (!googleProvider) {
		return {
			ok: false,
			error: { code: 'no-provider', message: 'Google provider not configured' },
		};
	}
	return signInWithProviderPopup(googleProvider);
}

/**
 * Sign-in using GitHub (popup)
 */
export async function signInWithGithub(): Promise<Result<UserCredential>> {
	if (!githubProvider) {
		return {
			ok: false,
			error: { code: 'no-provider', message: 'GitHub provider not configured' },
		};
	}
	return signInWithProviderPopup(githubProvider);
}

/**
 * Sign-in using redirect flow (starts redirect; does not return credential immediately)
 * Note: the redirect result should be handled where you initialize your app using getRedirectResult()
 */
export async function signInWithProviderRedirect(provider: AuthProvider): Promise<Result<void>> {
	try {
		await signInWithRedirect(auth, provider);
		return { ok: true, data: undefined };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Sign out the currently authenticated user
 */
export async function signOutUser(): Promise<Result<void>> {
	try {
		await signOut(auth);
		return { ok: true, data: undefined };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Check whether an email has any sign-in methods (i.e. account exists).
 * Returns Result<boolean> with true if account exists.
 */
export async function isEmailEnrolled(email: string): Promise<Result<boolean>> {
	try {
		const methods = await fetchSignInMethodsForEmail(auth, email);
		return { ok: true, data: methods.length > 0 };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Send password reset email ONLY if email is enrolled.
 * This prevents sending reset links to unknown emails.
 */
export async function sendResetPasswordEmail(email: string): Promise<Result<void>> {
	try {
		// validate email format quickly
		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return { ok: false, error: { code: 'invalid-email', message: 'Invalid email address.' } };
		}

		// Check enrollment first
		const enrolled = await isEmailEnrolled(email);
		if (!enrolled.ok) return enrolled; // bubble up error
		if (!enrolled.data) {
			return {
				ok: false,
				error: { code: 'user-not-found', message: 'No account found with that email.' },
			};
		}

		// Proceed to send reset link
		await sendPasswordResetEmail(auth, email);
		return { ok: true, data: undefined };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Confirm password reset given the code from the link and the new password
 */
export async function confirmPasswordResetWithCode(
	oobCode: string,
	newPassword: string
): Promise<Result<void>> {
	try {
		await confirmPasswordReset(auth, oobCode, newPassword);
		return { ok: true, data: undefined };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Update password for the currently signed-in user
 */
export async function updateCurrentUserPassword(newPassword: string): Promise<Result<void>> {
	const user = auth.currentUser;
	if (!user) {
		return { ok: false, error: { code: 'no-user', message: 'No authenticated user found.' } };
	}
	try {
		await updatePassword(user, newPassword);
		return { ok: true, data: undefined };
	} catch (err) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Get the currently signed in user (synchronous)
 */
export function getCurrentUser(): User | null {
	return auth.currentUser;
}

/**
 * Send verification email to the explicit user object.
 */
export async function sendVerificationToUser(user: User): Promise<Result<void>> {
	if (!user) {
		return { ok: false, error: { code: 'no-user', message: 'No user provided.' } };
	}
	try {
		await sendEmailVerification(user);
		return { ok: true, data: undefined };
	} catch (err: unknown) {
		return { ok: false, error: wrapError(err) };
	}
}

/**
 * Backwards-compatible: send verification using auth.currentUser
 */
export async function sendVerificationToCurrentUser(): Promise<Result<void>> {
	const user = auth.currentUser;
	if (!user)
		return { ok: false, error: { code: 'no-user', message: 'No authenticated user found.' } };
	return sendVerificationToUser(user);
}

/**
 * Firebase Auth user fields.
 *
 * Allows updating displayName, photoURL, and other future Firebase Auth properties.
 * This does NOT touch Firestore profile data — use user API for that.
 */
export async function updateAuthProfile(
	user: User,
	data: {
		displayName?: string;
		photoURL?: string;
	}
): Promise<Result<void>> {
	if (!user) {
		return { ok: false, error: { code: 'no-user', message: 'No authenticated user provided.' } };
	}

	try {
		const updateData: { displayName?: string; photoURL?: string } = {};

		if (data.displayName !== undefined) updateData.displayName = data.displayName;
		if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;

		await fbUpdateProfile(user, updateData);

		return { ok: true, data: undefined };
	} catch (err: unknown) {
		return { ok: false, error: wrapError(err) };
	}
}
