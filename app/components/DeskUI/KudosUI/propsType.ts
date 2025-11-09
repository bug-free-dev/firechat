import React from 'react';

import type { CachedUser, FireProfile, KudosTxn } from '@/app/lib/types';

export interface KudosPanelProps {
	currentUser: FireProfile;
	transactions: KudosTxn[];
	allUsers: CachedUser[];
	onSendKudos: (
		fromUid: string,
		toUid: string,
		amount: number,
		note?: string
	) => Promise<{ success: boolean; reason?: string }>;
	recentLimit?: number;
	className?: string;
}

export interface KudosCardProps {
	user: CachedUser;
	quickAmounts: number[];
	currentUserKudos: number;
	loading: boolean;
	onQuickSend: (user: CachedUser, amount: number) => void;
	onOpenDetailed: (user: CachedUser) => void;
}

export interface KudosTransactionItemProps {
	transaction: KudosTxn;
	currentUserId: string;
	getUsername: (uid: string) => string;
	txnIcon: (type: KudosTxn['type']) => React.ReactNode;
}

export interface KudosSlideProps {
	open: boolean;
	selected: CachedUser | null;
	currentUser: FireProfile;
	amountStr: string;
	note: string;
	loading: boolean;
	quickAmounts: number[];
	onClose: () => void;
	onAmountChange: (value: string) => void;
	onNoteChange: (value: string) => void;
	onSubmit: () => void;
}
