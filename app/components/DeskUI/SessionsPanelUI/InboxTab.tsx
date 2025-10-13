'use client';

import React from 'react';
import { FaInbox } from 'react-icons/fa';

import { FireProfile } from '@/app/lib/types';
import { InboxThread } from '@/app/lib/types';

import { InboxThreadCard } from './ThreadCard';

interface InboxTabProps {
	threads: InboxThread[];
	currentUser: FireProfile;
	onOpenInbox?: (threadId: string) => void;
	loading: boolean;
}

export function InboxTab({ threads, currentUser, onOpenInbox, loading }: InboxTabProps) {
	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<FaInbox className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-pulse" />
					<p className="text-neutral-500">Loading inbox...</p>
				</div>
			</div>
		);
	}

	if (threads.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<FaInbox className="w-20 h-20 mb-6 text-orange-300 opacity-50" />
				<h3 className="text-2xl font-dyna text-neutral-700 mb-2">No whispers in your inbox</h3>
				<p className="text-neutral-500 max-w-sm">
					Start a private conversation from someones profile to see messages here.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{threads.map((thread) => (
				<InboxThreadCard
					key={thread.id}
					thread={thread}
					currentUser={currentUser}
					onOpenInbox={onOpenInbox}
				/>
			))}
		</div>
	);
}
