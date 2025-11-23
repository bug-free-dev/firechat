'use client';

import { FiSend, FiUserPlus } from 'react-icons/fi';

import { FireArea, FireAvatar, FireButton, FireInput, FireSlide } from '@/app/components/UI';

import type { KudosSlideProps } from './propsType';

export const KudosSendSlide: React.FC<KudosSlideProps> = ({
	open,
	selected,
	currentUser,
	amountStr,
	note,
	loading,
	quickAmounts,
	onClose,
	onAmountChange,
	onNoteChange,
	onSubmit,
}) => {
	return (
		<FireSlide
			open={open}
			onClose={onClose}
			header={
				<div className="flex items-center gap-3">
					<FiSend className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
					<div>
						<div className="text-neutral-900 dark:text-neutral-200">Send Kudos</div>
						<div className="text-sm text-neutral-500 dark:text-neutral-400">
							{selected ? `@${selected.usernamey}` : 'Pick a recipient'}
						</div>
					</div>
				</div>
			}
			footer={
				<div className="flex gap-2 mt-2">
					<FireButton onClick={onClose} variant="outline" disabled={loading} className="flex-1">
						Cancel
					</FireButton>
					<FireButton
						onClick={onSubmit}
						className="flex-1"
						disabled={loading}
						loading={loading}
					>
						Send
					</FireButton>
				</div>
			}
			size="sm"
		>
			<div className="max-w-xl mx-auto">
				{/* Recipient */}
				<div className="flex items-center gap-4 mb-4">
					<div>
						{selected ? (
							<FireAvatar src={selected.avatarUrl} seed={selected.uid} size={56} />
						) : (
							<div className="w-14 h-14 rounded-md bg-neutral-200 dark:bg-neutral-800/50 flex items-center justify-center">
								<FiUserPlus className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
							{selected?.displayName ?? 'Pick someone'}
						</div>
						<div className="text-xs text-neutral-500 dark:text-neutral-400">
							@{selected?.usernamey ?? 'search or pick'}
						</div>
					</div>

					<div className="text-right">
						<div className="text-sm text-neutral-600 dark:text-neutral-400">Balance</div>
						<div className="text-lg font-semibold text-yellow-500 dark:text-yellow-400">
							{currentUser.kudos}
						</div>
					</div>
				</div>

				{/* Amount */}
				<div className="mb-3">
					<label className="text-sm text-neutral-600 dark:text-neutral-400 block mb-1">Amount</label>
					<FireInput
						value={amountStr}
						onChange={(e) => onAmountChange(e.target.value)}
						placeholder="Enter amount"
						type="number"
						
					/>
				</div>

				{/* Note */}
				<div className="mb-3">
					<label className="text-sm text-neutral-600 dark:text-neutral-400 block mb-1">Note (optional)</label>
					<FireArea
						value={note}
						onChange={(e) => onNoteChange(e.target.value)}
						placeholder="Say something nice (optional)..."
						rows={3}
						helperText="Keep it short and sweet"
						
					/>
				</div>

				{/* Quick Amount Buttons */}
				<div className="flex items-center gap-2 mt-2 flex-wrap">
					{quickAmounts.map((a) => {
						const selectedAmount = Number(amountStr) === a;
						return (
							<button
								key={a}
								onClick={() => onAmountChange(String(a))}
								className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
									selectedAmount
										? 'bg-neutral-900 text-white dark:bg-neutral-800/60 dark:text-white'
										: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-600/50 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-500/60'
								}`}
							>
								+{a}
							</button>
						);
					})}
				</div>

				{/* Tip */}
				<div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
					Tip: quick-send reduces friction — write a note if you want it personal.
				</div>
			</div>
		</FireSlide>
	);
};
