'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BiCrown, BiRocket } from 'react-icons/bi';
import { FiClock, FiGift, FiSearch, FiSend } from 'react-icons/fi';
import { RiCoinsLine } from 'react-icons/ri';

import { FireButton, FireInput } from '@/app/components/UI';
import type { CachedUser, KudosTxn } from '@/app/lib/types';

import { KudosCard, type KudosPanelProps, KudosSendSlide, KudosTransactionItem } from '../KudosUI';

export const KudosPanel: React.FC<KudosPanelProps> = ({
	currentUser,
	transactions,
	allUsers,
	onSendKudos,
	recentLimit = 8,
	className = '',
}) => {
	const router = useRouter();
	const [search, setSearch] = useState('');
	const [slideOpen, setSlideOpen] = useState(false);
	const [selected, setSelected] = useState<CachedUser | null>(null);
	const [note, setNote] = useState('');
	const [amountStr, setAmountStr] = useState('');
	const [loading, setLoading] = useState(false);

	const quickAmounts = [5, 10, 25, 50];

	const getUsername = (uid: string) => {
		const user = allUsers.find((u) => u.uid === uid);
		return user?.usernamey ?? uid;
	};

	const txnIcon = (type: KudosTxn['type']) => {
		switch (type) {
			case 'gift':
				return <FiGift className="w-4 h-4 text-pink-500" />;
			case 'reward':
				return <BiCrown className="w-4 h-4 text-lime-500" />;
			case 'system':
				return <BiRocket className="w-4 h-4 text-sky-500" />;
			default:
				return <FiGift className="w-4 h-4 text-yellow-500" />;
		}
	};

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return allUsers
			.filter((u) => u.uid !== currentUser.uid)
			.filter(
				(u) =>
					!q ||
					(u.usernamey ?? '').toLowerCase().includes(q) ||
					(u.displayName ?? '').toLowerCase().includes(q)
			)
			.slice(0, 15);
	}, [allUsers, search, currentUser.uid]);

	const quickSend = async (to: CachedUser, amt: number) => {
		if (amt <= 0) return;
		if (amt > currentUser.kudos) return toast.error('Not enough kudos');
		setLoading(true);

		try {
			const res = await onSendKudos(currentUser.uid, to.uid, amt, `Quick send ${amt}`);
			if (res.success) {
				toast.success(`Sent ${amt} to @${to.usernamey}`);
				router.refresh();
			} else {
				toast.error(res.reason ?? 'Failed to send');
				router.refresh();
			}
		} catch {
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

	const submitDetailed = async () => {
		if (!selected) return;
		const amt = Number.parseInt(amountStr || '0', 10);
		if (!amt || amt <= 0) return toast.error('Enter a valid amount');
		if (amt > currentUser.kudos) return toast.error('Not enough kudos');
		setLoading(true);

		try {
			const res = await onSendKudos(currentUser.uid, selected.uid, amt, note || undefined);
			if (res.success) {
				toast.success(`Sent ${amt} to @${selected.usernamey}`);
				setSlideOpen(false);
				router.refresh();
			} else {
				toast.error(res.reason ?? 'Failed to send');
				router.refresh();
			}
		} catch {
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

	const openDetailed = (to?: CachedUser) => {
		setSelected(to ?? null);
		setAmountStr('');
		setNote('');
		setSlideOpen(true);
	};
	return (
		<div
			className={`w-full px-4 py-6 bg-white dark:bg-neutral-900 transition-colors ${className}`}
		>
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 w-full px-2 sm:px-0">
					<div className="flex flex-col items-center gap-2 mb-6">
						<h2 className="font-bubblegum text-yellow-500 dark:text-yellow-100 text-3xl text-center font-semibold">
							<FiGift className="inline-block mr-2 text-yellow-500 dark:text-yellow-400" />{' '}
							Kudos
						</h2>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							Quick appreciation
						</p>
					</div>

					{/* Search + Send */}
					<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
						<div className="flex items-center gap-2 rounded-lg px-2 py-1 w-full sm:w-auto">
							<FiSearch className="text-neutral-500 dark:text-neutral-400" />
							<FireInput
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search anyone..."
								className="pl-5 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
							/>
						</div>

						<FireButton
							onClick={() => openDetailed()}
							className="flex items-center justify-center gap-2 w-full sm:w-auto transition-colors"
						>
							<FiSend className="text-neutral-900 dark:text-neutral-100" />
							<span className="text-sm">Send</span>
						</FireButton>
					</div>
				</div>

				{/* Balance + stats */}
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
					<div className="flex items-center gap-4">
						<div className="rounded-lg flex items-center justify-center transition-all">
							<RiCoinsLine className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
						</div>
						<div>
							<div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
								{currentUser.kudos}
							</div>
							<div className="text-sm text-neutral-500 dark:text-neutral-400">
								Your balance
							</div>
						</div>
					</div>

					<div className="flex gap-6 text-sm text-neutral-500 dark:text-neutral-400">
						<div>
							Given:{' '}
							<span className="font-medium text-neutral-900 dark:text-neutral-100">
								{currentUser.kudosGiven ?? 0}
							</span>
						</div>
						<div>
							Received:{' '}
							<span className="font-medium text-neutral-900 dark:text-neutral-100">
								{currentUser.kudosReceived ?? 0}
							</span>
						</div>
					</div>
				</div>

				{/* People list */}
				<div className="mb-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2 sm:gap-0">
						<div className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
							Quick-send badges
						</div>
					</div>

					<div className="mb-8">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
								People
							</h2>
							<div className="text-sm text-neutral-500 dark:text-neutral-400">
								{filtered.length} member{filtered.length !== 1 ? 's' : ''}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
							{filtered.map((u) => (
								<KudosCard
									key={u.uid}
									user={u}
									quickAmounts={quickAmounts}
									currentUserKudos={currentUser.kudos}
									loading={loading}
									onQuickSend={quickSend}
									onOpenDetailed={openDetailed}
								/>
							))}
						</div>

						{filtered.length === 0 && (
							<div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
								<FiSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
								<div>No members found</div>
							</div>
						)}
					</div>

					{/* Recent history */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
								Recent activity
							</h3>
							<div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
								<FiClock />
								<span>Latest {recentLimit}</span>
							</div>
						</div>

						<div className="space-y-3">
							{transactions.slice(0, recentLimit).map((txn) => (
								<KudosTransactionItem
									key={
										txn.id ?? `${txn.from}-${txn.to}-${txn.createdAt?.toString() ?? ''}`
									}
									transaction={txn}
									currentUserId={currentUser.uid}
									getUsername={getUsername}
									txnIcon={txnIcon}
								/>
							))}

							{transactions.length === 0 && (
								<div className="text-center py-8 text-neutral-400 dark:text-neutral-500">
									<FiGift className="w-10 h-10 mx-auto mb-2 text-yellow-500 dark:text-yellow-400" />
									<div>No transactions yet — be the first to send kudos!</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<KudosSendSlide
					open={slideOpen}
					selected={selected}
					currentUser={currentUser}
					amountStr={amountStr}
					note={note}
					loading={loading}
					quickAmounts={quickAmounts}
					onClose={() => setSlideOpen(false)}
					onAmountChange={setAmountStr}
					onNoteChange={setNote}
					onSubmit={submitDetailed}
				/>
			</div>
		</div>
	);
};
