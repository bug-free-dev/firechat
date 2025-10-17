'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface TagInputProps {
	value: string[];
	onChange: (next: string[]) => void;
	placeholder?: string;
	max?: number;
	prefix?: string;
	editable?: boolean;
}

export default function TagInput({
	value,
	onChange,
	placeholder = 'Add tag and press Enter',
	max = 12,
	prefix = '',
	editable = false,
}: TagInputProps) {
	const [input, setInput] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (value.length >= max) setInput('');
	}, [value.length, max]);

	const addTag = (raw: string) => {
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

	const removeTag = (idx: number) => {
		const next = value.slice();
		next.splice(idx, 1);
		onChange(next);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			e.stopPropagation();
			addTag(input);
		} else if (e.key === 'Backspace' && input === '') {
			e.preventDefault();
			if (value.length > 0) onChange(value.slice(0, -1));
		}
	};

	const tagColors = [
		'bg-blue-50 text-blue-700',
		'bg-violet-50 text-violet-700',
		'bg-emerald-50 text-emerald-700',
		'bg-amber-50 text-amber-700',
		'bg-rose-50 text-rose-700',
		'bg-cyan-50 text-cyan-700',
		'bg-indigo-50 text-indigo-700',
		'bg-teal-50 text-teal-700',
	];

	return (
		<div className="flex flex-col gap-1">
			<div
				className={`flex flex-wrap items-center gap-2 px-3 py-4 rounded-lg border ${
					editable ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50'
				} transition-all`}
				onClick={() => editable && inputRef.current?.focus()}
			>
				{value.map((v, i) => {
					const colorClass = tagColors[i % tagColors.length];
					return (
						<div
							key={`${v}-${i}`}
							className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium ${colorClass}`}
						>
							{prefix && <span className="text-xs opacity-80">{prefix}</span>}
							<span className="truncate max-w-[10rem]">{v}</span>
							{editable && (
								<button
									type="button"
									aria-label={`Remove ${v}`}
									onClick={() => removeTag(i)}
									className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-neutral-200 transition"
								>
									&times;
								</button>
							)}
						</div>
					);
				})}

				{editable && value.length < max && (
					<input
						ref={inputRef}
						type="text"
						inputMode="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						className="flex-1 min-w-[120px] outline-none bg-transparent text-sm placeholder:text-neutral-400 py-1"
					/>
				)}
			</div>

			{editable && (
				<div className="flex justify-between text-xs text-neutral-500 px-2">
					<span>Press Enter to add • Backspace to remove</span>
					<span className="font-medium">
						{value.length}/{max}
					</span>
				</div>
			)}
		</div>
	);
}
