import React from 'react';

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

export interface KudosCardProps {
	user: FireCachedUser;
	quickAmounts: number[];
	currentUserKudos: number;
	loading: boolean;
	onQuickSend: (user: FireCachedUser, amount: number) => void;
	onOpenDetailed: (user: FireCachedUser) => void;
}

export interface KudosTransactionItemProps {
	transaction: KudosTxn;
	currentUserId: string;
	getUsername: (uid: string) => string;
	txnIcon: (type: KudosTxn['type']) => React.ReactNode;
}

export interface KudosSlideProps {
	open: boolean;
	selected: FireCachedUser | null;
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
