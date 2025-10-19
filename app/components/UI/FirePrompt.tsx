'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { RiKey2Line, RiLockPasswordLine } from 'react-icons/ri';

import { FireButton, FireInput, FireSlide, type FireSlideProps } from '.';

export type FirePromptProps = Omit<FireSlideProps, 'children'> & {
	value: string;
	onChange: (v: string) => void;
	onSubmit?: () => void;
	verify?: (input: string) => boolean | Promise<boolean>;
	placeholder?: string;
	loadingText?: string;
};

export const FirePrompt: React.FC<FirePromptProps> = ({
	open,
	onClose,
	value,
	onChange,
	onSubmit,
	verify,
	placeholder = 'Enter your secret identifier...',
	size = 'md',
	backdropStatic = false,
	id,
	loadingText = 'Verifying identity...',
}) => {
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!value.trim()) return;
		if (verify) {
			try {
				setLoading(true);
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
	};

	return (
		<FireSlide
			open={open}
			onClose={onClose}
			size={size}
			backdropStatic={backdropStatic}
			id={id}
			footer={
				<div className="flex flex-col sm:flex-row gap-3 items-center justify-end">
					<FireButton
						onClick={handleSubmit}
						disabled={!value.trim() || loading}
						variant="default"
						loading={loading}
					>
						{loading ? loadingText : 'Verify'}
					</FireButton>
				</div>
			}
		>
			<div className="relative w-full h-full min-h-[400px] flex flex-col items-center justify-center overflow-hidden ">
				{/* Main content */}
				<div className="relative z-10 max-w-md w-full px-6 text-center flex flex-col gap-6">
					<h1 className="font-dyna text-4xl sm:text-5xl text-neutral-900 inline-flex items-center justify-center gap-3">
						<RiLockPasswordLine className="text-lime-500 w-10 h-10" />
						Verify Identifier
					</h1>

					<p className="text-neutral-500 font-righteous text-base">
						Enter your secure access key to continue
					</p>

					<FireInput
						variant="custom"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						type="password"
						showPasswordToggle
						onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
					/>

					<p className="text-neutral-500 text-sm flex items-center justify-center gap-2">
						<RiKey2Line className="w-4 h-4 text-slate-400" />
						Your key remains private and never leaves this device.
					</p>
				</div>
			</div>
		</FireSlide>
	);
};
