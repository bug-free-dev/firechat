'use client';

import React, { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { RiKey2Line, RiLockPasswordLine } from 'react-icons/ri';

import { FireButton, FireInput, FireSlide, type FireSlideProps } from '@/app/components/UI';

export interface FirePromptProps extends Omit<FireSlideProps, 'children'> {
	value: string;
	onChange: (value: string) => void;
	onSubmit?: () => void;
	verify?: (input: string) => boolean | Promise<boolean>;
	placeholder?: string;
	loadingText?: string;
	title?: string;
	description?: string;
}

export const FirePrompt: React.FC<FirePromptProps> = ({
	open,
	onClose,
	value,
	onChange,
	onSubmit,
	verify,
	placeholder = 'Enter your secure identifier...',
	size = 'md',
	backdropStatic = false,
	id,
	loadingText = 'Verifying identity...',
	title = 'Verify Identifier',
	description = 'Enter your secure access key to continue',
}) => {
	const [loading, setLoading] = useState(false);

	const handleSubmit = useCallback(async () => {
		if (!value.trim()) return;

		if (verify) {
			setLoading(true);
			try {
				const valid = await verify(value);
				if (!valid) {
					toast.error('Invalid identifier. Please try again.');
					return;
				}
			} catch {
				toast.error('Verification failed. Try again later.');
				return;
			} finally {
				setLoading(false);
			}
		}

		onSubmit?.();
	}, [value, verify, onSubmit]);

	return (
		<FireSlide
			open={open}
			onClose={onClose}
			size={size}
			header="Prove your identity!"
			backdropStatic={backdropStatic}
			id={id}
			footer={
				<div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full mt-2">
					<FireButton
						onClick={handleSubmit}
						disabled={!value.trim() || loading}
						variant="outline"
						loading={loading}
					>
						{loading ? loadingText : 'Verify'}
					</FireButton>
				</div>
			}
		>
			<div className="flex flex-col items-center justify-center w-full min-h-[400px] px-6 py-8 gap-6 text-center bg-white dark:bg-neutral-900 rounded-lg">
				{/* Header */}
				<h1 className="flex items-center justify-center gap-3 text-4xl font-semibold text-neutral-900 dark:text-neutral-100">
					<RiLockPasswordLine className="text-lime-500 w-10 h-10" />
					{title}
				</h1>

				{/* Description */}
				<p className="text-neutral-500 dark:text-neutral-400 font-medium text-base max-w-sm">
					{description}
				</p>

				{/* Input */}
				<div className="w-full max-w-md">
					<FireInput
						variant="custom"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						type="password"
						showPasswordToggle
						onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
						className="bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700/40 focus:ring-2 focus:ring-lime-400 dark:focus:ring-lime-500"
					/>
				</div>

				{/* Info */}
				<p className="flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mt-2">
					<RiKey2Line className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
					Your key remains private and never leaves this device.
				</p>
			</div>
		</FireSlide>
	);
};
