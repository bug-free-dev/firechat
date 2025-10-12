'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import FireAvatar from '@/app/components/UI/FireAvatar';
import FireButton from '@/app/components/UI/FireButton';
import FireInput from '@/app/components/UI/FireInput';
import FireSlide from '@/app/components/UI/FireSlide';
import type { FireCachedUser, SessionDoc } from '@/app/lib/types';
import { searchUsersByUsername } from '@/app/lib/utils/memory';

interface InvitePickerProps {
	open: boolean;
	onClose: () => void;
	frequentUsers: FireCachedUser[];
	session: SessionDoc;
	onConfirm: (users: FireCachedUser[]) => void;
}

export default function InvitePicker({
	open,
	onClose,
	frequentUsers = [],
	session,
	onConfirm,
}: InvitePickerProps) {
	const [selected, setSelected] = useState<Map<string, FireCachedUser>>(new Map());
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<FireCachedUser[]>([]);
	const [loading, setLoading] = useState(false);

	// reset when opened/closed
	useEffect(() => {
		if (!open) {
			setSelected(new Map());
			setQuery('');
			setResults([]);
		}
	}, [open]);

	// debounce search and call memory.searchUsersByUsername
	useEffect(() => {
		let canceled = false;
		if (!query.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		const id = setTimeout(async () => {
			try {
				const out = await searchUsersByUsername(query.trim());
				if (!canceled) setResults(out.slice(0, 50));
			} catch {
				if (!canceled) toast.error('Search failed');
			} finally {
				if (!canceled) setLoading(false);
			}
		}, 220);

		return () => {
			canceled = true;
			clearTimeout(id);
		};
	}, [query]);

	const toggle = (u: FireCachedUser) => {
		setSelected((prev) => {
			const m = new Map(prev);
			if (m.has(u.uid)) m.delete(u.uid);
			else {
				if (m.size >= 50) {
					toast('Max 50 invites at once');
					return m;
				}
				m.set(u.uid, u);
			}
			return m;
		});
	};

	const confirm = () => {
		if (selected.size === 0) {
			toast('Select at least one contact');
			return;
		}
		onConfirm(Array.from(selected.values()));
	};

	// Combine frequent users (filter out duplicates and session participants)
	const frequentFiltered = useMemo(() => {
		const partSet = new Set(session.participants ?? []);
		return frequentUsers.filter((u) => !partSet.has(u.uid)).slice(0, 12);
	}, [frequentUsers, session.participants]);

	return (
		<FireSlide
			open={open}
			onClose={onClose}
			header={`Invite to ${session.title ?? 'session'}`}
			size="md"
		>
			<div className="space-y-4">
				<p className="text-sm text-neutral-600">
					Pick contacts to invite — they will receive a friendly inbox invite.
				</p>

				{/* Frequent users bar */}
				{frequentFiltered.length > 0 && (
					<div>
						<div className="text-xs text-neutral-500 mb-2">Frequent</div>
						<div className="flex gap-3 overflow-x-auto py-1 ">
							{frequentFiltered.map((u) => {
								const picked = selected.has(u.uid);
								return (
									<button
										key={u.uid}
										onClick={() => toggle(u)}
										className={`flex flex-col items-center gap-1 min-w-[60px] p-1 rounded-md transition ${
											picked
												? 'bg-neutral-200/30 rounded-xl ml-2 ring-2 ring-yellow-400'
												: ''
										}`}
										aria-pressed={picked}
									>
										<FireAvatar seed={u.uid} src={u.avatarUrl ?? null} size={48} />
										<span className="text-xs truncate max-w-[72px]">@{u.usernamey}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Search */}
				<div>
					<FireInput
						value={query}
						onChange={setQuery}
						placeholder="Search by username or display name"
					/>
					{loading && <div className="text-sm text-neutral-500 mt-2">Searching...</div>}

					{results.length > 0 && (
						<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
							{results.map((u) => {
								const active = selected.has(u.uid);
								return (
									<button
										key={u.uid}
										onClick={() => toggle(u)}
										className={`w-full p-2 rounded-lg border flex items-center gap-3 text-left transition ${
											active
												? 'border-yellow-300 bg-yellow-50'
												: 'border-neutral-200 hover:shadow-sm'
										}`}
									>
										<FireAvatar seed={u.uid} src={u.avatarUrl ?? null} size={36} />
										<div className="flex-1">
											<div className="font-medium text-sm">@{u.usernamey}</div>
											<div className="text-xs text-neutral-500 truncate">
												{u.displayName}
											</div>
										</div>
										<div className="text-sm text-neutral-400">
											{active ? 'Selected' : 'Add'}
										</div>
									</button>
								);
							})}
						</div>
					)}

					{!loading && query && results.length === 0 && (
						<div className="mt-2 text-sm text-neutral-500">
							No matches — try another name.
						</div>
					)}
				</div>

				{/* Selected preview */}
				{selected.size > 0 && (
					<div className="flex items-center gap-2 flex-wrap">
						{Array.from(selected.values()).map((u) => (
							<div
								key={u.uid}
								className="flex items-center gap-2 px-3 py-1 rounded-xl bg-neutral-50 border border-neutral-200"
							>
								<FireAvatar seed={u.uid} src={u.avatarUrl ?? null} size={28} />
								<div className="text-xs">@{u.usernamey}</div>
								<button onClick={() => toggle(u)} className="text-xs text-neutral-400 ml-2">
									×
								</button>
							</div>
						))}
					</div>
				)}

				{/* Footer */}
				<div className="flex justify-end gap-3">
					<FireButton variant="secondary" onClick={onClose}>
						Cancel
					</FireButton>
					<FireButton onClick={confirm}>
						Invite {selected.size > 0 ? `(${selected.size})` : ''}
					</FireButton>
				</div>
			</div>
		</FireSlide>
	);
}
