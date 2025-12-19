'use client';

import { useState } from 'react';
import { HiOutlineStar } from 'react-icons/hi';
import { IoAdd, IoClose } from 'react-icons/io5';

import { FireButton, FireInput, QUIRK_COLORS } from '@/app/components/UI';

type QuirkInputProps = {
	value: string[];
	onChange: (quirks: string[]) => void;
	placeholder?: string;
	max?: number;
	editable: boolean;
};

export const QuirkInput: React.FC<QuirkInputProps> = ({
	value,
	onChange,
	placeholder = 'Add a quirk...',
	max = 6,
	editable,
}) => {
	const [input, setInput] = useState('');

	const handleAdd = () => {
		const trimmed = input.trim();
		if (trimmed && value.length < max && !value.includes(trimmed)) {
			onChange([...value, trimmed]);
			setInput('');
		}
	};

	const handleRemove = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAdd();
		}
	};

	const progress = (value.length / max) * 100;

	return (
		<div className="space-y-6">
			{/* Quirks Display */}
			{value.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{value.map((quirk, index) => {
						const colorSet = QUIRK_COLORS[index % QUIRK_COLORS.length];
						return (
							<span
								key={index}
								className={`
                  group inline-flex items-center gap-1.5 px-3 py-1.5
                  rounded-full ${colorSet.bg} ${colorSet.text} ${colorSet.border}
                  text-sm font-medium
                  transition-all duration-200 ${colorSet.hover}
                `}
							>
								<HiOutlineStar className="w-3.5 h-3.5 opacity-70" />
								<span>{quirk}</span>
								{editable && (
									<button
										onClick={() => handleRemove(index)}
										className="ml-0.5 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
										aria-label={`Remove ${quirk}`}
									>
										<IoClose className="w-3.5 h-3.5" />
									</button>
								)}
							</span>
						);
					})}
				</div>
			) : (
				!editable && (
					<p className="text-sm text-neutral-400 dark:text-neutral-600">No quirks yet</p>
				)
			)}

			{/* Input Section */}
			{editable && (
				<div className="space-y-3">
					<div className="flex gap-2">
						<div className="flex-1 max-w-sm">
							<FireInput
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={placeholder}
								disabled={value.length >= max}
								size="sm"
							/>
						</div>
						<FireButton
							onClick={handleAdd}
							disabled={!input.trim() || value.length >= max}
							variant="outline"
							size="sm"
						>
							<IoAdd className="w-4 h-4" />
						</FireButton>
					</div>

					{/* Progress Indicator */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-neutral-500 dark:text-neutral-400 font-medium">
								{value.length} / {max}
							</span>
							{value.length >= max && (
								<span className="text-purple-600 dark:text-purple-400 font-medium">
									All quirks added
								</span>
							)}
						</div>
						<div className="h-1 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
							<div
								className={`h-full transition-all duration-300 ${
									value.length >= max
										? 'bg-purple-500'
										: 'bg-neutral-900 dark:bg-neutral-100'
								}`}
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
