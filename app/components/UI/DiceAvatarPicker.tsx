'use client';

import React, { useEffect, useState } from 'react';
import { HiCheck, HiRefresh, HiX } from 'react-icons/hi';

import { FireButton, FireHeader, FireInput } from '@/app/components/UI';

import { getSvgUrl, randomSeed } from './avatarHelpers';
import { DICEBEAR_THEMES } from './constants';

type Props = {
	displayName?: string;
	onSelect: (url: string) => void;
	onClose: () => void;
};

export const DiceAvatarPicker: React.FC<Props> = ({ displayName = '', onSelect, onClose }) => {
	const [selectedTheme, setSelectedTheme] = useState<string>('adventurer');
	const [seed, setSeed] = useState<string>(displayName || 'user');

	useEffect(() => {
		if (displayName) setSeed(displayName);
	}, [displayName]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/30 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl dark:shadow-black/30 transition-colors"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<FireHeader showSubtitle={false} />

				<div className="flex items-center justify-between px-4 border-b border-neutral-100 dark:border-neutral-700/50">
					<div className="min-w-0">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 truncate">
							Choose Avatar
						</h3>
						<p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
							Pick a refined style
						</p>
					</div>

					<button
						onClick={onClose}
						className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
						aria-label="Close"
						type="button"
					>
						<HiX className="w-4 h-4 text-zinc-500 dark:text-neutral-300" />
					</button>
				</div>

				<div className="overflow-y-auto max-h-[calc(86vh-200px)] p-4 sm:p-5">
					<div className="flex flex-col items-center gap-3 mb-5">
						<img
							src={getSvgUrl({ theme: selectedTheme, seed, size: 320 })}
							alt="Avatar preview"
							className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full ring-2 ring-neutral-200 dark:ring-neutral-700"
							loading="lazy"
						/>

						<div className="w-full max-w-md flex items-center gap-2 px-2">
							<FireInput
								value={seed}
								onChange={(e) => setSeed(e.target.value)}
								placeholder="Customize seed..."
								className="flex-1 text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
								aria-label="Customize seed"
								size="sm"
							/>
							<FireButton
								onClick={() => setSeed(randomSeed())}
								variant="outline"
								className="!p-2"
								aria-label="Randomize"
								size="sm"
							>
								<HiRefresh className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
							</FireButton>
						</div>
					</div>

					<div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5 px-2">
						{DICEBEAR_THEMES.map((theme) => {
							const isSelected = selectedTheme === theme.id;
							return (
								<button
									key={theme.id}
									type="button"
									title={theme.name}
									aria-pressed={isSelected}
									onClick={() => setSelectedTheme(theme.id)}
									className={`relative flex flex-col items-center p-2 rounded-xl transition-transform transform focus:outline-none ${
										isSelected
											? 'scale-105 ring-2 ring-zinc-400 bg-zinc-50 dark:ring-zinc-500 dark:bg-zinc-700/50'
											: 'ring-2 ring-neutral-200 dark:ring-neutral-700/40 bg-neutral-50 dark:bg-neutral-800 hover:ring-neutral-300 dark:hover:ring-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700/60'
									}`}
								>
									<div className="w-full aspect-square rounded-md overflow-hidden mb-1">
										<img
											src={getSvgUrl({ theme: theme.id, seed, size: 160 })}
											alt={theme.name}
											className="w-full h-full object-cover"
											loading="lazy"
											draggable={false}
										/>
									</div>

									<p className="text-[11px] font-medium text-zinc-600 dark:text-neutral-300 text-center truncate w-full px-1">
										{theme.name}
									</p>

									{isSelected && (
										<div className="absolute -top-1 -right-1 bg-zinc-600 dark:bg-zinc-400 rounded-full p-0.5">
											<HiCheck className="w-3 h-3 text-white dark:text-neutral-900" />
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-neutral-200 dark:border-neutral-700/50">
					<FireButton onClick={onClose} variant="outline">
						Cancel
					</FireButton>
					<FireButton
						onClick={() => onSelect(getSvgUrl({ theme: selectedTheme, seed, size: 320 }))}
						variant="default"
					>
						Select
					</FireButton>
				</div>
			</div>
		</div>
	);
};
