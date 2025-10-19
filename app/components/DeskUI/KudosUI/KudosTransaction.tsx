'use client';

import type { KudosTransactionItemProps } from './propsType';

export const KudosTransactionItem: React.FC<KudosTransactionItemProps> = ({
	transaction,
	currentUserId,
	getUsername,
	txnIcon,
}) => {
	const isOutgoing = transaction.from === currentUserId;

	return (
		<div className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-white">
			<div className="flex items-center gap-3 min-w-0">
				<div>{txnIcon(transaction.type)}</div>
				<div className="min-w-0">
					<div className="text-sm font-medium text-neutral-800 truncate">
						{isOutgoing
							? `To @${getUsername(transaction.to)}`
							: `From @${getUsername(transaction.from)}`}
					</div>
					{transaction.note && (
						<div className="text-xs text-neutral-500 truncate">{transaction.note}</div>
					)}
				</div>
			</div>

			<div className="text-right">
				<div
					className={`text-sm font-semibold ${isOutgoing ? 'text-red-500' : 'text-lime-500'}`}
				>
					{isOutgoing ? '-' : '+'}
					{transaction.amount}
				</div>
				<div className="text-xs text-neutral-400">
					{transaction.createdAt instanceof Date ? transaction.createdAt.toLocaleString() : ''}
				</div>
			</div>
		</div>
	);
};
