'use client';

import { FireLoader } from '@/app/components/UI/FireLoader';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import { AuthState } from '../util/helper';

interface ProtectedRouteProps {
	children: React.ReactNode;
	/**
	 * Which auth states are allowed to see this route.
	 * If authState doesn't match, user is redirected automatically by AuthProvider.
	 */
	allowedStates?: AuthState[];
	/**
	 * Fallback component shown while auth state is resolving.
	 */
	fallback?: React.ReactNode;
}

/**
 * ProtectedRoute wrapper component.
 * Enforces auth state requirements and shows loading state while resolving.
 *
 * Usage:
 * <ProtectedRoute allowedStates={[AuthState.AUTHENTICATED]}>
 *   <DeskPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
	children,
	allowedStates = [AuthState.AUTHENTICATED],
	fallback,
}: ProtectedRouteProps) {
	const { authState, isLoading } = useAuthState();

	// Show loading state while auth is resolving
	if (isLoading) {
		return fallback || <FireLoader />;
	}

	// Check if current authState is allowed
	const isAllowed = allowedStates.includes(authState);

	// If not allowed, AuthProvider will handle redirect.
	// Show loading state while redirect processes.
	if (!isAllowed) {
		return fallback || <FireLoader />;
	}

	// Auth state matches; render children
	return <>{children}</>;
}
