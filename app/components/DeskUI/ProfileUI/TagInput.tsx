'use client';

import { useState } from 'react';
import { HiX } from 'react-icons/hi';

import { TAG_COLORS } from '@/app/components/UI';

type TagInputProps = {
	value: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
	max?: number;
	prefix?: string;
	editable: boolean;
};

export const TagInput: React.FC<TagInputProps> = ({
	value,
	onChange,
	placeholder = 'Add tag...',
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
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				{value.map((tag, index) => {
					const colorSet = TAG_COLORS[index % TAG_COLORS.length];

					return (
						<span
							key={index}
							className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                ring-2 ${colorSet.bg} ${colorSet.text} ${colorSet.ring}
                transition-all duration-200 hover:scale-105
              `}
						>
							<span>{tag}</span>
							{editable && (
								<button
									onClick={() => handleRemove(index)}
									className="hover:opacity-70 transition-opacity"
									aria-label={`Remove ${tag}`}
								>
									<HiX className="w-3 h-3" />
								</button>
							)}
						</span>
					);
				})}

				{value.length === 0 && !editable && (
					<span className="text-sm text-gray-400 italic">No tags yet</span>
				)}
			</div>

			{editable && (
				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={value.length >= max}
						className="
              flex-1 px-3 py-2 text-sm rounded-lg 
              bg-white ring-2 ring-gray-200/30
              focus:ring-gray-300/40 outline-none transition-all 
              disabled:bg-gray-50 disabled:cursor-not-allowed
            "
					/>
					<button
						onClick={handleAdd}
						disabled={!input.trim() || value.length >= max}
						className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-gray-900 text-white hover:bg-gray-800
              disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors
            "
					>
						Add
					</button>
				</div>
			)}
		</div>
	);
};
