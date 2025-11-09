'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { FireAvatar } from '@/app/components/UI';
import type { CachedUser } from '@/app/lib/types';
import { getUserByUid } from '@/app/lib/utils/memory';

export interface ReactionsBadgeProps {
	reactions: Record<string, string[]>;
	currentUserId: string;
	onToggle: (emoji: string) => void;
}

type UserCacheMap = Map<string, CachedUser | null>;

const PREVIEW_AVATARS = 4;

const ReactionsBadge: React.FC<ReactionsBadgeProps> = ({ reactions, currentUserId, onToggle }) => {
	const [userCache, setUserCache] = useState<{ map: UserCacheMap; loading: boolean }>({
		map: new Map(),
		loading: false,
	});

	const previewUids = useMemo(() => {
		const uids: string[] = [];
		for (const [_, arr] of Object.entries(reactions || {})) {
			for (let i = 0; i < Math.min(PREVIEW_AVATARS, arr.length); i++) {
				const uid = arr[i];
				if (!uids.includes(uid)) uids.push(uid);
			}
			if (uids.length >= 20) break; // safety cap
		}
		return uids;
	}, [reactions]);

	// lazy fetch preview avatars on mount / reactions change
	useEffect(() => {
		let mounted = true;
		if (previewUids.length === 0) {
			setUserCache({ map: new Map(), loading: false });
			return () => {
				mounted = false;
			};
		}

		// only fetch uids missing from cache
		const missing = previewUids.filter((uid) => !userCache.map.has(uid));
		if (missing.length === 0)
			return () => {
				mounted = false;
			};

		setUserCache((s) => ({ ...s, loading: true }));
		void (async () => {
			const map = new Map(userCache.map);
			await Promise.all(
				missing.map(async (uid) => {
					try {
						const user = await getUserByUid(uid);
						map.set(uid, user ?? null);
					} catch {
						map.set(uid, null);
					}
				})
			);
			if (!mounted) return;
			setUserCache({ map, loading: false });
		})();

		return () => {
			mounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [previewUids]);

	const handleToggle = useCallback(
		(emoji: string) => {
			onToggle(emoji);
		},
		[onToggle]
	);

	const emojiEntries = useMemo(() => Object.entries(reactions || {}), [reactions]);

	if (!reactions || emojiEntries.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-2 items-center">
			{emojiEntries.map(([emoji, uids]) => {
				const count = uids.length;
				const hasReacted = uids.includes(currentUserId);
				// Show the latest PREVIEW_AVATARS (most recent first visually)
				const preview = uids.slice(0, PREVIEW_AVATARS);

				return (
					<div key={emoji} className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => handleToggle(emoji)}
							aria-pressed={hasReacted}
							title={`${count} ${count === 1 ? 'person' : 'people'} reacted`}
							className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium transition-transform active:scale-95 ${
								hasReacted
									? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
									: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
							}`}
						>
							<span className="text-sm leading-none">{emoji}</span>
							<span className="text-[10px] font-semibold">{count}</span>
						</button>

						{/* overlapping avatars */}
						<div className="flex -space-x-2 items-center">
							{preview.map((uid, i) => {
								const cached = userCache.map.get(uid) ?? null;
								// small avatars, slightly stacked and with thin white border for separation
								return (
									<div
										key={uid}
										className={`relative z-${10 - i} rounded-full ring-1 ring-white shadow-sm`}
										style={{ marginLeft: i === 0 ? 0 : undefined }}
									>
										<FireAvatar
											seed={cached?.uid ?? uid}
											size={24}
											src={cached?.avatarUrl ?? null}
											className="border border-white/80"
										/>
									</div>
								);
							})}

							{count > PREVIEW_AVATARS && (
								<div className="ml-1 text-[11px] text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-100">
									+{count - PREVIEW_AVATARS}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default ReactionsBadge;
