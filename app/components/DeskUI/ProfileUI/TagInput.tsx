'use client';

import { useState } from 'react';
import { IoAdd, IoClose, IoSparkles } from 'react-icons/io5';
import { RiPriceTag3Line } from 'react-icons/ri';

import { FireButton, FireInput, TAG_COLORS } from '@/app/components/UI';

type TagInputProps = {
	value: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
	max?: number;
	editable: boolean;
};

export const TagInput: React.FC<TagInputProps> = ({
	value,
	onChange,
	placeholder = 'Add a tag...',
	max = 12,
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

	return (
		<div className="space-y-2">
			{/* Tags Display Container */}
			<div>
				{value.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{value.map((tag, index) => {
							const colorSet = TAG_COLORS[index % TAG_COLORS.length];

							return (
								<span
									key={index}
									className={`
                    group inline-flex items-center gap-2 pl-3 pr-2 py-1
                    rounded-xl ${colorSet.bg} ${colorSet.text} ${colorSet.ring}
                    dark:${colorSet.bg} dark:${colorSet.text} dark:${colorSet.ring}
                    text-sm font-medium tracking-tight
                    transition-all duration-200 ease-out
                    hover:shadow-sm ${colorSet.hover} dark:hover:shadow-lg dark:hover:shadow-black/10
                  `}
								>
									<RiPriceTag3Line className="w-3.5 h-3.5 opacity-60" />
									<span>{tag}</span>
									{editable && (
										<button
											onClick={() => handleRemove(index)}
											className="ml-0.5 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150"
											aria-label={`Remove ${tag}`}
										>
											<IoClose className="w-3 h-3" />
										</button>
									)}
								</span>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-500 py-2">
						<IoSparkles className="w-5 h-5 mb-1.5 opacity-30" />
						<span className="text-sm">{editable ? 'No tags yet' : 'No tags available'}</span>
					</div>
				)}
			</div>

			{/* Input Section */}
			{editable && (
				<div className="space-y-2">
					<div className="flex gap-2 items-center">
						{/* input grows to take available space */}
						<div className="flex-1 max-w-[400px] mt-2">
							<FireInput
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={placeholder}
								disabled={value.length >= max}
								variant="default"
								size="sm"
							/>
						</div>

						<FireButton
							onClick={handleAdd}
							disabled={!input.trim() || value.length >= max}
							variant="default"
							size="sm"
							className="mt-2"
						>
							<IoAdd className="w-4 h-4 mr-1" />
							Add
						</FireButton>
					</div>

					{/* Tag Counter */}
					<div className="flex items-center justify-between px-0.5">
						<span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
							{value.length} / {max} tags
						</span>
						{value.length >= max && (
							<span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
								Maximum reached
							</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
