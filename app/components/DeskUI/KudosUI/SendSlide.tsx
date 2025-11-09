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
					<FiSend className="w-5 h-5" style={{ color: 'var(--monokai-yellow)' }} />
					<div>
						<div className="text-neutral-800">Send Kudos</div>
						<div className="text-sm text-neutral-500">
							{selected ? `@${selected.usernamey}` : 'Pick a recipient'}
						</div>
					</div>
				</div>
			}
			footer={
				<div className="flex gap-2">
					<FireButton onClick={onClose} variant="outline" disabled={loading}>
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
						onChange={(e) => onAmountChange(e.target.value)}
						placeholder="Enter amount"
						type="number"
						className="text-lg font-medium"
					/>
				</div>

				<div className="mb-3">
					<label className="text-sm text-neutral-600 block mb-1">Note (optional)</label>
					<FireArea
						value={note}
						onChange={(e) => onNoteChange(e.target.value)}
						placeholder="Say something nice (optional)..."
						rows={3}
						helperText="Keep it short and sweet"
					/>
				</div>

				<div className="flex items-center gap-2 mt-2">
					{quickAmounts.map((a) => (
						<button
							key={a}
							onClick={() => onAmountChange(String(a))}
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
	);
};
