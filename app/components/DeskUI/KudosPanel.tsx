'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiGift, FiClock, FiSend, FiSearch, FiUserPlus } from 'react-icons/fi';
import { BiCrown, BiRocket } from 'react-icons/bi';

import FireArea from '@/app/components/UI/FireArea';
import FireAvatar from '@/app/components/UI/FireAvatar';
import FireButton from '@/app/components/UI/FireButton';
import FireInput from '@/app/components/UI/FireInput';
import FireSlide from '@/app/components/UI/FireSlide';
import type { FireCachedUser, FireProfile, KudosTxn } from '@/app/lib/types';

export interface KudosPanelProps {
	currentUser: FireProfile;
	transactions: KudosTxn[];
	allUsers: FireCachedUser[];
	onSendKudos: (
		fromUid: string,
		toUid: string,
		amount: number,
		note?: string
	) => Promise<{ success: boolean; reason?: string }>;
	recentLimit?: number;
	className?: string;
}

export default function KudosPanel({
	currentUser,
	transactions,
	allUsers,
	onSendKudos,
	recentLimit = 8,
	className = '',
}: KudosPanelProps) {
	const router = useRouter();
	const [search, setSearch] = useState('');
	const [slideOpen, setSlideOpen] = useState(false);
	const [selected, setSelected] = useState<FireCachedUser | null>(null);
	const [note, setNote] = useState('');
	const [amountStr, setAmountStr] = useState('');
	const [loading, setLoading] = useState(false);

	const quickAmounts = [5, 10, 25];

	// filtered users (compact display) — exclude current user
	function getUsername(uid: string) {
		const user = allUsers.find((u) => u.uid === uid);
		return user?.usernamey ?? uid; // fallback to UID if not found
	}

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
			.slice(0, 40);
	}, [allUsers, search, currentUser.uid]);

	const txnIcon = (type: KudosTxn['type']) => {
		switch (type) {
			case 'gift':
				return <FiGift className="w-4 h-4 text-pink-500" />;
			case 'reward':
				return <BiCrown className="w-4 h-4" style={{ color: 'var(--monokai-yellow)' }} />;
			case 'system':
				return <BiRocket className="w-4 h-4 text-sky-500" />;
			default:
				return <FiGift className="w-4 h-4" style={{ color: 'var(--monokai-yellow)' }} />;
		}
	};

	async function quickSend(to: FireCachedUser, amt: number) {
		if (amt <= 0) return;
		if (amt > currentUser.kudos) return toast.error('Not enough kudos');
		setLoading(true);

		try {
			const res = await onSendKudos(currentUser.uid, to.uid, amt, `Quick send ${amt}`);
			if (res.success) {
				toast.success(`Sent ${amt} to @${to.usernamey}`);
				// Refresh quietly to reflect backend updates
				router.refresh();
			} else {
				toast.error(res.reason ?? 'Failed to send');
				router.refresh(); // Revert if mismatch
			}
		} catch {
			router.refresh();
		} finally {
			setLoading(false);
		}
	}

	async function submitDetailed() {
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
	}

	function openDetailed(to?: FireCachedUser) {
		setSelected(to ?? null);
		setAmountStr('');
		setNote('');
		setSlideOpen(true);
	}

	return (
		<div className={`w-full px-4 py-6 bg-white ${className}`}>
			<div className="max-w-5xl mx-auto">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 w-full px-2 sm:px-0">
					{/* Heading */}
					<div className="flex flex-col items-center gap-2 mb-6">
						<h2 className="font-dyna text-[var(--monokai-yellow)] text-3xl text-center font-semibold">
							<FiGift className="inline-block mr-2 text-[var(--monokai-yellow)]" /> Kudos
						</h2>
						<p className="text-sm text-neutral-600">Quick appreciation</p>
					</div>

					{/* Search + Send */}
					<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
						{/* Search input */}
						<div className="flex items-center gap-2 rounded-lg px-2 py-1 w-full sm:w-auto">
							<FiSearch className="text-neutral-500" />
							<FireInput
								value={search}
								onChange={(e) =>
									setSearch((e as React.ChangeEvent<HTMLInputElement>).target.value)
								}
								placeholder="Find your 'Fire friend'..."
								className="pl-5"
							/>
						</div>

						{/* Send button */}
						<button
							onClick={() => openDetailed()}
							className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-700 w-full sm:w-auto"
							aria-label="Detailed send"
						>
							<FiSend className="text-neutral-700" />
							<span className="text-sm">Send</span>
						</button>
					</div>
				</div>

				{/* Balance + stats */}
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
					<div className="flex items-center gap-4">
						<div
							className="rounded-lg flex items-center justify-center"
							style={{
								width: 88,
								height: 88,
								background: '#fff',
								boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
							}}
						>
							<BiCrown className="w-10 h-10" style={{ color: 'var(--monokai-yellow)' }} />
						</div>
						<div>
							<div className="text-3xl" style={{ color: 'var(--monokai-yellow)' }}>
								{currentUser.kudos}
							</div>
							<div className="text-sm text-neutral-600">Your balance</div>
						</div>
					</div>

					<div className="flex gap-6 text-sm text-neutral-600">
						<div>
							Given:{' '}
							<span className="font-medium text-neutral-800">
								{currentUser.kudosGiven ?? 0}
							</span>
						</div>
						<div>
							Received:{' '}
							<span className="font-medium text-neutral-800">
								{currentUser.kudosReceived ?? 0}
							</span>
						</div>
					</div>
				</div>

				{/* People list (compact) */}
				<div className="mb-6">
					{/* FireHeader */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2 sm:gap-0">
						<div className="text-sm text-neutral-500 hidden sm:block">Quick-send badges</div>
					</div>

					{/* People grid */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-2xl font-bold text-neutral-900">People</h2>
							<div className="text-sm text-neutral-500">
								{filtered.length} user{filtered.length !== 1 ? 's' : ''}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
							{filtered.map((u) => (
								<div
									key={u.uid}
									className="bg-white rounded-xl border border-neutral-200 p-3 md:p-4 hover:shadow-sm transition-all duration-200"
								>
									{/* User Info */}
									<div className="flex items-center gap-3 mb-4">
										<FireAvatar src={u.avatarUrl} seed={u.uid} size={44} />
										<div className="flex-1 min-w-0">
											<div className="font-semibold text-neutral-900 truncate">
												@{u.usernamey}
											</div>
											<div className="text-sm text-neutral-500 flex items-center gap-2">
												<FiGift className="w-3 h-3 text-yellow-500" />
												<span>{u.kudos ?? 0}</span>
												<span>·</span>
												<span>{String(u.meta?.mood ?? '—')}</span>
											</div>
										</div>
									</div>

									{/* Action Buttons (compact on smaller screens) */}
									<div className="flex items-center gap-2">
										{quickAmounts.map((a) => (
											<button
												key={a}
												onClick={() => quickSend(u, a)}
												disabled={loading || a > currentUser.kudos}
												className={`flex-1 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-colors ${
													a > currentUser.kudos
														? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
														: 'bg-neutral-900 text-white hover:bg-neutral-800'
												}`}
											>
												+{a}
											</button>
										))}
										<button
											onClick={() => openDetailed(u)}
											className="px-2 py-1.5 md:px-3 md:py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg transition-colors"
											aria-label={`Send custom amount to ${u.usernamey}`}
										>
											<FiSend className="w-4 h-4" />
										</button>
									</div>
								</div>
							))}
						</div>
						{filtered.length === 0 && (
							<div className="text-center py-12 text-neutral-400">
								<FiSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
								<div>No users found</div>
							</div>
						)}
					</div>

					{/* Recent history */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-semibold text-neutral-800">Recent activity</h3>
							<div className="flex items-center gap-2 text-sm text-neutral-500">
								<FiClock />
								<span>Latest {recentLimit}</span>
							</div>
						</div>

						<div className="space-y-3">
							{transactions.slice(0, recentLimit).map((txn) => (
								<div
									key={
										txn.id ?? `${txn.from}-${txn.to}-${txn.createdAt?.toString() ?? ''}`
									}
									className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-white"
								>
									<div className="flex items-center gap-3 min-w-0">
										<div>{txnIcon(txn.type)}</div>
										<div className="min-w-0">
											<div className="text-sm font-medium text-neutral-800 truncate">
												{txn.from === currentUser.uid
													? `To @${getUsername(txn.to)}`
													: `From @${getUsername(txn.from)}`}
											</div>
											{txn.note ? (
												<div className="text-xs text-neutral-500 truncate">
													{txn.note}
												</div>
											) : null}
										</div>
									</div>

									<div className="text-right">
										<div
											className={`text-sm font-semibold ${
												txn.from === currentUser.uid ? 'text-red-500' : 'text-lime-500'
											}`}
										>
											{txn.from === currentUser.uid ? '-' : '+'}
											{txn.amount}
										</div>
										<div className="text-xs text-neutral-400">
											{txn.createdAt instanceof Date
												? txn.createdAt.toLocaleString()
												: ''}
										</div>
									</div>
								</div>
							))}

							{transactions.length === 0 && (
								<div className="text-center py-8 text-neutral-400">
									<FiGift
										className="w-10 h-10 mx-auto mb-2"
										style={{ color: 'var(--monokai-yellow)' }}
									/>
									<div>No transactions yet — be the first to send kudos!</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* FireSlide detailed send */}
				<FireSlide
					open={slideOpen}
					onClose={() => setSlideOpen(false)}
					header={
						<div className="flex items-center gap-3">
							<FiSend className="w-5 h-5" style={{ color: 'var(--monokai-yellow)' }} />
							<div>
								<div className="text-sm font-semibold text-neutral-800">Send Kudos</div>
								<div className="text-xs text-neutral-500">
									{selected ? `@${selected.usernamey}` : 'Pick a recipient'}
								</div>
							</div>
						</div>
					}
					footer={
						<div className="flex gap-2">
							<button
								onClick={() => setSlideOpen(false)}
								className="flex-1 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50"
								disabled={loading}
							>
								Cancel
							</button>
							<FireButton onClick={submitDetailed} className="flex-1" disabled={loading}>
								{loading ? 'Sending...' : 'Send'}
							</FireButton>
						</div>
					}
					size="sm"
				>
					<div className="max-w-xl mx-auto">
						<div className="flex items-center gap-4 mb-4">
							<div>
								{selected ? (
									<FireAvatar src={selected.avatarUrl} seed={selected.uid} size={56} />
								) : (
									<div className="w-14 h-14 rounded-md bg-neutral-100 flex items-center justify-center">
										<FiUserPlus className="w-6 h-6 text-neutral-400" />
									</div>
								)}
							</div>

							<div className="flex-1 min-w-0">
								<div className="text-sm font-medium text-neutral-800">
									{selected?.displayName ?? 'Pick someone'}
								</div>
								<div className="text-xs text-neutral-500">
									@{selected?.usernamey ?? 'search or pick'}
								</div>
							</div>

							<div>
								<div className="text-sm text-neutral-600">Balance</div>
								<div className="text-lg" style={{ color: 'var(--monokai-yellow)' }}>
									{currentUser.kudos}
								</div>
							</div>
						</div>

						<div className="mb-3">
							<label className="text-sm text-neutral-600 block mb-1">Amount</label>
							<FireInput
								value={amountStr}
								onChange={(e) =>
									setAmountStr((e as React.ChangeEvent<HTMLInputElement>).target.value)
								}
								placeholder="Enter amount"
								type="number"
								className="text-lg font-medium"
							/>
						</div>

						<div className="mb-3">
							<label className="text-sm text-neutral-600 block mb-1">Note (optional)</label>
							<FireArea
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder="Say something nice (optional)..."
								rows={3}
								helperText="Keep it short and sweet"
							/>
						</div>

						<div className="flex items-center gap-2 mt-2">
							{quickAmounts.map((a) => (
								<button
									key={a}
									onClick={() => setAmountStr(String(a))}
									className={`px-3 py-2 rounded-md text-sm ${
										Number(amountStr) === a
											? 'bg-black text-white'
											: 'bg-yellow-50 text-yellow-800'
									}`}
									style={
										Number(amountStr) === a
											? { background: '#111', color: '#fff' }
											: { background: '#fff', border: '1px solid rgba(0,0,0,0.04)' }
									}
								>
									+{a}
								</button>
							))}
						</div>

						<div className="mt-4 text-xs text-neutral-400">
							Tip: quick-send reduces friction — write a note if you want it personal.
						</div>
					</div>
				</FireSlide>
			</div>
		</div>
	);
}
