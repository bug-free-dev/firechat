'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaTimes } from 'react-icons/fa';

export default function TagInput({
	value,
	onChange,
	placeholder = 'Add tag and press Enter',
	max = 12,
	prefix = '',
	editable = false,
}: {
	value: string[];
	onChange: (next: string[]) => void;
	placeholder?: string;
	max?: number;
	prefix?: string;
	editable?: boolean;
}) {
	const [input, setInput] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		// keep input placeholder / disabled consistent when max reached
		if (value.length >= max) setInput('');
	}, [value.length, max]);

	const add = (raw: string) => {
		const v = raw.trim();
		if (!v) return;
		if (value.includes(v)) {
			setInput('');
			toast('Already added');
			return;
		}
		if (value.length >= max) {
			toast.error(`Maximum ${max} items allowed`);
			return;
		}
		onChange([...value, v]);
		setInput('');
	};

	const removeAt = (idx: number) => {
		const next = value.slice();
		next.splice(idx, 1);
		onChange(next);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			add(input);
		} else if (e.key === 'Backspace' && input === '') {
			if (value.length > 0) onChange(value.slice(0, -1));
		}
	};

	// soft color palette like shadcn
	const tagColors = [
		'bg-blue-50 text-blue-700 border border-blue-100',
		'bg-violet-50 text-violet-700 border border-violet-100',
		'bg-emerald-50 text-emerald-700 border border-emerald-100',
		'bg-amber-50 text-amber-700 border border-amber-100',
		'bg-rose-50 text-rose-700 border border-rose-100',
		'bg-cyan-50 text-cyan-700 border border-cyan-100',
		'bg-indigo-50 text-indigo-700 border border-indigo-100',
		'bg-teal-50 text-teal-700 border border-teal-100',
	];

	return (
		<div>
			<div
				className={`flex flex-wrap gap-2 p-3 border rounded-lg min-h-[56px] items-center transition-colors ${
					editable ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50'
				}`}
				onClick={() => editable && inputRef.current?.focus()}
			>
				{value.length === 0 && (
					<div className="text-sm text-neutral-400 w-full">
						{editable ? placeholder : 'No items yet'}
					</div>
				)}

				{value.map((v, i) => {
					const colorClass = tagColors[i % tagColors.length];
					return (
						<div
							key={`${v}-${i}`}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${colorClass}`}
						>
							{prefix && <span className="text-xs font-medium opacity-80">{prefix}</span>}
							<span className="font-medium truncate max-w-[10rem]">{v}</span>
							{editable && (
								<button
									aria-label={`Remove ${v}`}
									onClick={() => removeAt(i)}
									className="ml-1 p-1 rounded hover:bg-neutral-100 transition"
									type="button"
								>
									<FaTimes className="w-3 h-3 opacity-70" />
								</button>
							)}
						</div>
					);
				})}

				{editable && (
					<div className="flex items-center gap-2 flex-1 min-w-[140px]">
						<input
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={value.length >= max ? `Limit ${max} reached` : placeholder}
							disabled={value.length >= max}
							className="flex-1 px-2 py-1 text-sm outline-none bg-transparent placeholder:text-neutral-400"
						/>
						<button
							onClick={() => add(input)}
							disabled={!input.trim() || value.length >= max}
							className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 transition text-sm"
							type="button"
							aria-label="Add tag"
						>
							<FaPlus className="w-3 h-3" />
						</button>
					</div>
				)}
			</div>

			{editable && (
				<div className="text-xs text-neutral-500 mt-2 flex items-center justify-between">
					<span>Press Enter to add • Backspace to remove</span>
					<span className="font-medium">
						{value.length}/{max}
					</span>
				</div>
			)}
		</div>
	);
}
