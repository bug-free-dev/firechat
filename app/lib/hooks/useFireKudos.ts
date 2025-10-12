'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getKudosBalance, getKudosHistoryAll, transferKudos } from '@/app/lib/api/kudosAPI';
import type { FireProfile, KudosTxn } from '@/app/lib/types';

interface UseKudosOptions {
	currentUser: FireProfile | null;
	autoRefreshInterval?: number;
}

interface UseKudosReturn {
	balance: number;
	transactions: KudosTxn[];
	loading: boolean;
	sending: boolean;
	sendKudos: (
		toUid: string,
		amount: number,
		note?: string
	) => Promise<{ success: boolean; reason?: string }>;
	refreshBalance: () => Promise<void>;
	refreshTransactions: () => Promise<void>;
	refresh: () => Promise<void>;
}

export function useKudos({
	currentUser,
	autoRefreshInterval = 30000,
}: UseKudosOptions): UseKudosReturn {
	const [balance, setBalance] = useState(currentUser?.kudos || 0);
	const [transactions, setTransactions] = useState<KudosTxn[]>([]);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);

	const previousBalanceRef = useRef(balance);
	const mountedRef = useRef(true);
	const inFlightRefreshRef = useRef<Promise<void> | null>(null);
	const currentUserRef = useRef(currentUser);
	const loadedForUidRef = useRef<string | null>(null);

	// Update ref when currentUser changes
	useEffect(() => {
		currentUserRef.current = currentUser;
	}, [currentUser]);

	// Sync balance with currentUser prop
	useEffect(() => {
		if (currentUser?.kudos !== undefined) {
			setBalance(currentUser.kudos);
		}
	}, [currentUser?.kudos]);

	// Fetch balance from server (stable)
	const refreshBalance = useCallback(async (): Promise<void> => {
		const user = currentUserRef.current;
		if (!user?.uid || !mountedRef.current) return;
		try {
			const serverBalance = await getKudosBalance(user.uid);
			if (mountedRef.current) {
				setBalance(serverBalance);
			}
		} catch {
			/** Ignore errors silently for balance refresh */
		}
	}, []);

	// Fetch transaction history (stable)
	const refreshTransactions = useCallback(async (): Promise<void> => {
		const user = currentUserRef.current;
		if (!user?.uid || !mountedRef.current) return;
		try {
			const history = await getKudosHistoryAll(user.uid, 10);
			if (mountedRef.current) {
				setTransactions(history);
			}
		} catch {
			/** Ignore errors silently for history refresh */
		}
	}, []);

	// Refresh both balance and transactions (stable)
	const refresh = useCallback(async (): Promise<void> => {
		// ensure function always returns a Promise<void> on every code path
		if (!mountedRef.current) return Promise.resolve();
		if (inFlightRefreshRef.current) return inFlightRefreshRef.current;

		const p = (async () => {
			setLoading(true);
			try {
				await Promise.all([refreshBalance(), refreshTransactions()]);
			} finally {
				if (mountedRef.current) setLoading(false);
				inFlightRefreshRef.current = null;
			}
		})();

		inFlightRefreshRef.current = p;
		return p;
	}, [refreshBalance, refreshTransactions]);

	// Send kudos (stable)
	const sendKudos = useCallback(
		async (
			toUid: string,
			amount: number,
			note?: string
		): Promise<{ success: boolean; reason?: string }> => {
			const user = currentUserRef.current;
			if (!user?.uid) return { success: false, reason: 'Not authenticated' };
			if (amount <= 0) return { success: false, reason: 'Invalid amount' };
			if (amount > balance) return { success: false, reason: 'Insufficient balance' };
			if (sending) return { success: false, reason: 'Already sending' };

			previousBalanceRef.current = balance;
			setBalance((b) => b - amount);

			const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			const tempTxn: KudosTxn = {
				id: tempId,
				from: user.uid,
				to: toUid,
				amount,
				type: 'gift',
				note: note ?? '',
				createdAt: new Date().toISOString(),
			};
			setTransactions((prev) => [tempTxn, ...prev]);

			setSending(true);
			try {
				const result = await transferKudos(user.uid, toUid, amount, note);

				if (result.success) {
					await refresh();
					return { success: true };
				}

				// if not success -> rollback
				if (mountedRef.current) {
					setBalance(previousBalanceRef.current);
					setTransactions((prev) => prev.filter((t) => t.id !== tempId));
				}
				return { success: false, reason: result.reason ?? 'Server rejected' };
			} catch (err) {
				if (mountedRef.current) {
					setBalance(previousBalanceRef.current);
					setTransactions((prev) => prev.filter((t) => t.id !== tempId));
				}
				return { success: false, reason: (err as Error)?.message ?? 'Network error' };
			} finally {
				if (mountedRef.current) setSending(false);
			}
		},
		[balance, refresh, sending]
	);

	// Initial load - only once per UID
	useEffect(() => {
		const currentUid = currentUser?.uid;

		if (!currentUid || loadedForUidRef.current === currentUid) {
			return;
		}

		loadedForUidRef.current = currentUid;
		void refresh(); // explicitly mark fire-and-forget to satisfy no-floating-promises
	}, [currentUser?.uid, refresh]);

	// Auto-refresh interval - only set up once
	useEffect(() => {
		if (!currentUser?.uid || autoRefreshInterval <= 0) return;

		const id = setInterval(() => {
			void refresh();
		}, autoRefreshInterval);

		return () => {
			clearInterval(id);
		};
	}, [currentUser?.uid, autoRefreshInterval, refresh]);

	// Cleanup on unmount
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	return {
		balance,
		transactions,
		loading,
		sending,
		sendKudos,
		refreshBalance,
		refreshTransactions,
		refresh,
	};
}
