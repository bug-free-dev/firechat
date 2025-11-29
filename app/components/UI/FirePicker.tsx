'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCheckDouble } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { MdOutlinePersonAdd } from 'react-icons/md';

import type { CachedUser, SessionDoc } from '@/app/lib/types';
import { searchUsersByUsername } from '@/app/lib/utils/memory';

import { FireAvatar, FireButton, FireInput, FireSlide } from '.';

interface PickerProps {
	open: boolean;
	onClose: () => void;
	frequentUsers?: CachedUser[];
	session?: SessionDoc;
	currentParticipants?: string[];
	onConfirm: (users: CachedUser[]) => void;
	title?: string;
	description?: string;
	maxSelection?: number;
	searchUsers?: (query: string) => Promise<CachedUser[]>;
}

export const FirePicker: React.FC<PickerProps> = ({
	open,
	onClose,
	frequentUsers = [],
	session,
	currentParticipants = [],
	onConfirm,
	title,
	description = 'Pick contacts to invite — they will receive a friendly inbox invite.',
	maxSelection = 50,
	searchUsers,
}) => {
	const [selected, setSelected] = useState<Map<string, CachedUser>>(new Map());
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<CachedUser[]>([]);
	const [loading, setLoading] = useState(false);

	const searchUsersRef = useRef(searchUsers);
	const currentParticipantsRef = useRef(currentParticipants);

	useEffect(() => {
		searchUsersRef.current = searchUsers;
		currentParticipantsRef.current = currentParticipants;
	}, [searchUsers, currentParticipants]);

	useEffect(() => {
		if (!open) {
			setSelected(new Map());
			setQuery('');
			setResults([]);
		}
	}, [open]);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}
		let canceled = false;
		setLoading(true);

		const performSearch = async () => {
			try {
				const fn = searchUsersRef.current || searchUsersByUsername;
				const out = await fn(query.trim());
				if (!canceled) {
					const participantSet = new Set(currentParticipantsRef.current);
					setResults(out.filter((u) => !participantSet.has(u.uid)).slice(0, 50));
				}
			} catch {
				if (!canceled) toast.error('Search failed');
			} finally {
				if (!canceled) setLoading(false);
			}
		};

		const timeout = setTimeout(() => void performSearch(), 200);
		return () => {
			canceled = true;
			clearTimeout(timeout);
		};
	}, [query]);

	const toggle = useCallback(
		(u: CachedUser) => {
			setSelected((prev) => {
				const m = new Map(prev);
				if (m.has(u.uid)) {
					m.delete(u.uid);
				} else {
					if (m.size >= maxSelection) {
						toast(`Max ${maxSelection} selections`);
						return prev;
					}
					m.set(u.uid, u);
				}
				return m;
			});
		},
		[maxSelection]
	);

	const confirm = useCallback(() => {
		if (selected.size === 0) {
			toast('Select at least one contact');
			return;
		}
		onConfirm(Array.from(selected.values()));
		onClose();
	}, [selected, onConfirm, onClose]);

	const frequentFiltered = useMemo(() => {
		const partSet = new Set(currentParticipants);
		return frequentUsers.filter((u) => !partSet.has(u.uid)).slice(0, 12);
	}, [frequentUsers, currentParticipants]);

	const headerTitle = useMemo(
		() => title || (session ? `Invite to ${session.title ?? 'session'}` : 'Invite Members'),
		[title, session]
	);

	const selectedArray = useMemo(() => Array.from(selected.values()), [selected]);

	return (
		<FireSlide open={open} onClose={onClose} header={headerTitle} size="md">
			<div className="space-y-4">
				<p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>

				{/* Frequent Users */}
				{frequentFiltered.length > 0 && (
					<div className="animate-slide-in">
						<div className="flex items-center gap-2 mb-2">
							<div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
								Frequent
							</div>
							<div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700/40" />
						</div>
						<div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
							{frequentFiltered.map((u) => {
								const picked = selected.has(u.uid);
								return (
									<button
										key={u.uid}
										onClick={() => toggle(u)}
										className={`flex flex-col items-center gap-1 min-w-[60px] transition-all duration-200`}
										aria-pressed={picked}
									>
										<FireAvatar
											seed={u.uid}
											src={u.avatarUrl ?? null}
											size={36}
											className={`${picked ? 'ring-offset-4 ring-2 dark:ring-offset-neutral-900 ring-yellow-600/80' : ''}`}
										/>
										<span
											className={`text-xs truncate max-w-[56px] font-medium mt-1 ${
												picked
													? 'text-yellow-600/80'
													: 'text-neutral-700 dark:text-neutral-300'
											}`}
										>
											@{u.usernamey}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Search Users */}
				<div className="animate-slide-in">
					<div className="flex items-center gap-2 mb-2">
						<div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
							Search Members
						</div>
						<div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700/40" />
					</div>
					<div className="flex items-center gap-2 rounded-lg px-2 py-1 w-full sm:w-auto ">
						<FiSearch className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
						<FireInput
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by username or display name..."
							className="bg-transparent dark:bg-transparent focus:ring-2 focus:ring-yellow-400/30"
						/>
					</div>

					{loading && (
						<div className="flex items-center justify-center py-4">
							<div className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-300/40 dark:border-neutral-600 border-t-yellow-500" />
						</div>
					)}

					{!loading && results.length > 0 && (
						<div className="mt-2 grid p-4 grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
							{results.map((u) => {
								const active = selected.has(u.uid);
								return (
									<button
										key={u.uid}
										onClick={() => toggle(u)}
										className={`truncate p-2 flex items-center gap-2 text-left rounded-lg ring-2 transition-all duration-200 ${
											active
												? 'ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
												: 'ring-neutral-200 hover:ring-neutral-300 dark:ring-neutral-700/40 dark:hover:ring-neutral-600/40'
										}`}
									>
										<FireAvatar seed={u.uid} src={u.avatarUrl ?? null} size={32} />
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm truncate text-neutral-900 dark:text-neutral-100">
												@{u.usernamey}
											</div>
											<div className="text-xs truncate text-neutral-500 dark:text-neutral-400">
												{u.displayName}
											</div>
										</div>
										<div className="text-yellow-500 text-lg">
											{active ? (
												<FaCheckDouble className="w-3 h-3" />
											) : (
												<MdOutlinePersonAdd />
											)}
										</div>
									</button>
								);
							})}
						</div>
					)}

					{!loading && query && results.length === 0 && (
						<div className="mt-4 text-center py-6 text-sm text-neutral-500 dark:text-neutral-400">
							No matches — try another name.
						</div>
					)}
				</div>

				{/* Selected */}
				{selected.size > 0 && (
					<div className="animate-fade-scale">
						<div className="flex items-center gap-2 mb-2">
							<div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
								Selected ({selected.size})
							</div>
							<div className="h-px flex-1 bg-neutral-300/20 dark:bg-neutral-700/30" />
						</div>

						<div className="flex items-center gap-1 flex-wrap bg-neutral-100/50 dark:bg-neutral-900/30 rounded-xl p-2 backdrop-blur-sm">
							{selectedArray.map((u) => (
								<div
									key={u.uid}
									className="flex items-center gap-1 px-2 py-1 rounded-full ring-2 ring-neutral-400/30 dark:ring-neutral-600/40 hover:bg-white/20 dark:hover:bg-neutral-700/50 transition-colors duration-200 m-[2px]"
								>
									<FireAvatar seed={u.uid} src={u.avatarUrl ?? null} size={20} />
									<div className="text-xs font-medium text-neutral-800 dark:text-neutral-100 truncate">
										@{u.usernamey}
									</div>
									<button
										onClick={() => toggle(u)}
										aria-label="Remove"
										className="transition-transform hover:scale-110"
									>
										<IoCloseCircleOutline className="w-4 h-4 text-neutral-400 dark:text-neutral-300 hover:text-red-400 dark:hover:text-red-400 transition-colors duration-200" />
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-2 pt-2">
					<FireButton variant="outline" onClick={onClose}>
						Cancel
					</FireButton>
					<FireButton onClick={confirm} disabled={selected.size === 0}>
						Invite {selected.size > 0 ? `(${selected.size})` : ''}
					</FireButton>
				</div>
			</div>
		</FireSlide>
	);
};
