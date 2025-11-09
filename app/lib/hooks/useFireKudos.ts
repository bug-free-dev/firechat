'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getKudosBalance, getKudosHistoryAll, transferKudos } from '@/app/lib/api/kudosAPI';
import type { FireProfile, KudosTxn } from '@/app/lib/types';
import { create } from '@/app/lib/utils/time';

/* <----- TYPES -----> */
interface UseKudosOptions {
	currentUser: FireProfile | null;
	autoRefreshInterval?: number;
}

interface UseKudosReturn {
	balance: number;
	transactions: KudosTxn[];
	loading: boolean;
	sending: boolean;
	error: string | null;
	sendKudos: (
		toUid: string,
		amount: number,
		note?: string
	) => Promise<{ success: boolean; reason?: string }>;
	refreshBalance: () => Promise<void>;
	refreshTransactions: () => Promise<void>;
	refresh: () => Promise<void>;
}

/* <----- HOOK -----> */
export function useKudos({
	currentUser,
	autoRefreshInterval = 30000,
}: UseKudosOptions): UseKudosReturn {
	/* -------- STATE -------- */
	const [balance, setBalance] = useState(currentUser?.kudos ?? 0);
	const [transactions, setTransactions] = useState<KudosTxn[]>([]);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/* -------- REFS -------- */
	const previousBalanceRef = useRef(balance);
	const mountedRef = useRef(true);
	const inFlightRefreshRef = useRef<Promise<void> | null>(null);
	const currentUserRef = useRef(currentUser);
	const loadedForUidRef = useRef<string | null>(null);
	const lastSuccessfulFetchRef = useRef<number>(0);

	/* -------- SYNC CURRENT USER -------- */
	useEffect(() => {
		currentUserRef.current = currentUser;
	}, [currentUser]);

	useEffect(() => {
		if (currentUser?.kudos !== undefined) {
			setBalance(currentUser.kudos);
		}
	}, [currentUser?.kudos]);

	/* -------- REFRESH BALANCE -------- */
	const refreshBalance = useCallback(async (): Promise<void> => {
		const user = currentUserRef.current;
		if (!user?.uid || !mountedRef.current) return;

		try {
			const serverBalance = await getKudosBalance(user.uid);
			if (mountedRef.current) {
				setBalance(serverBalance);
				setError(null);
			}
		} catch {
			if (mountedRef.current) {
				setError('Failed to fetch balance');
			}
		}
	}, []);

	/* -------- REFRESH TRANSACTIONS -------- */
	const refreshTransactions = useCallback(async (): Promise<void> => {
		const user = currentUserRef.current;
		if (!user?.uid || !mountedRef.current) return;

		try {
			const history = await getKudosHistoryAll(user.uid, 20);

			if (mountedRef.current) {
				// Only update if we got data OR it's the first fetch
				if (history.length > 0 || lastSuccessfulFetchRef.current === 0) {
					setTransactions(history);
					lastSuccessfulFetchRef.current = create.nowMs();
					setError(null);
				}
			}
		} catch {
			if (mountedRef.current) {
				setError('Failed to fetch transactions');
			}
		}
	}, []);

	/* -------- REFRESH BOTH -------- */
	const refresh = useCallback(async (): Promise<void> => {
		if (!mountedRef.current) return Promise.resolve();

		// Prevent concurrent refreshes
		if (inFlightRefreshRef.current) {
			return inFlightRefreshRef.current;
		}

		const refreshPromise = (async () => {
			setLoading(true);
			setError(null);

			try {
				await Promise.all([refreshBalance(), refreshTransactions()]);
			} catch (err) {
				if (mountedRef.current) {
					const message = err instanceof Error ? err.message : 'Refresh failed';
					setError(message);
				}
			} finally {
				if (mountedRef.current) {
					setLoading(false);
				}
				inFlightRefreshRef.current = null;
			}
		})();

		inFlightRefreshRef.current = refreshPromise;
		return refreshPromise;
	}, [refreshBalance, refreshTransactions]);

	/* -------- SEND KUDOS -------- */
	const sendKudos = useCallback(
		async (
			toUid: string,
			amount: number,
			note?: string
		): Promise<{ success: boolean; reason?: string }> => {
			const user = currentUserRef.current;

			/* Validation */
			if (!user?.uid) {
				return { success: false, reason: 'Not authenticated' };
			}
			if (!toUid?.trim()) {
				return { success: false, reason: 'Invalid recipient' };
			}
			if (amount <= 0 || !isFinite(amount)) {
				return { success: false, reason: 'Invalid amount' };
			}
			if (amount > balance) {
				return { success: false, reason: 'Insufficient balance' };
			}
			if (sending) {
				return { success: false, reason: 'Please wait...' };
			}

			/* Optimistic Update Setup */
			previousBalanceRef.current = balance;
			const tempId = `temp-${create.nowMs()}-${Math.random().toString(36).slice(2, 9)}`;

			const tempTxn: KudosTxn = {
				id: tempId,
				from: user.uid,
				to: toUid,
				amount,
				type: 'gift',
				note: note?.trim() ?? '',
				createdAt: create.nowISO(),
			};

			// Apply optimistic update
			setBalance((prev) => prev - amount);
			setTransactions((prev) => [tempTxn, ...prev]);
			setSending(true);
			setError(null);

			try {
				/* Server Transaction */
				const result = await transferKudos(user.uid, toUid, amount, note);

				if (result.success) {
					// SUCCESS: Remove temp, fetch real data
					if (mountedRef.current) {
						setTransactions((prev) => prev.filter((t) => t.id !== tempId));
					}

					// Fetch latest data from server
					await refresh();

					return { success: true };
				}

				// SERVER REJECTION: Rollback
				if (mountedRef.current) {
					setBalance(previousBalanceRef.current);
					setTransactions((prev) => prev.filter((t) => t.id !== tempId));
					setError(result.reason ?? 'Transaction failed');
				}

				return {
					success: false,
					reason: result.reason ?? 'Server rejected transaction',
				};
			} catch (err) {
				// NETWORK ERROR: Rollback
				if (mountedRef.current) {
					setBalance(previousBalanceRef.current);
					setTransactions((prev) => prev.filter((t) => t.id !== tempId));

					const errorMsg = err instanceof Error ? err.message : 'Network error';
					setError(errorMsg);
				}

				return {
					success: false,
					reason: err instanceof Error ? err.message : 'Network error',
				};
			} finally {
				if (mountedRef.current) {
					setSending(false);
				}
			}
		},
		[balance, refresh, sending]
	);

	/* -------- INITIAL LOAD -------- */
	useEffect(() => {
		const currentUid = currentUser?.uid;

		// Only load once per user
		if (!currentUid || loadedForUidRef.current === currentUid) {
			return;
		}

		loadedForUidRef.current = currentUid;

		// Reset state for new user
		setTransactions([]);
		setError(null);
		lastSuccessfulFetchRef.current = 0;

		// Initial fetch
		void refresh();
	}, [currentUser?.uid, refresh]);

	/* -------- AUTO-REFRESH INTERVAL -------- */
	useEffect(() => {
		if (!currentUser?.uid || autoRefreshInterval <= 0) return;

		const intervalId = setInterval(() => {
			// Only refresh if not currently loading and user is authenticated
			if (!loading && mountedRef.current && currentUserRef.current?.uid) {
				void refresh();
			}
		}, autoRefreshInterval);

		return () => clearInterval(intervalId);
	}, [currentUser?.uid, autoRefreshInterval, loading, refresh]);

	/* -------- CLEANUP -------- */
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			// Cancel in-flight requests
			inFlightRefreshRef.current = null;
		};
	}, []);

	/* -------- RETURN -------- */
	return {
		balance,
		transactions,
		loading,
		sending,
		error,
		sendKudos,
		refreshBalance,
		refreshTransactions,
		refresh,
	};
}
