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
			className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/30"
			onClick={onClose}
		>
			<div
				className="bg-white rounded-xl max-w-3xl w-full max-h-[95vh] overflow-hidden shadow-xl"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<FireHeader showSubtitle={false} />

				<div className="flex items-center justify-between px-4 py-3 ring-b ring-neutral-100">
					<div className="min-w-0">
						<h3 className="text-lg font-semibold text-slate-900 truncate">Choose Avatar</h3>
						<p className="text-xs text-zinc-500 mt-0.5">Pick a refined style</p>
					</div>

					<button
						onClick={onClose}
						className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
						aria-label="Close"
						type="button"
					>
						<HiX className="w-4 h-4 text-zinc-500" />
					</button>
				</div>

				<div className="overflow-y-auto max-h-[calc(86vh-200px)] p-4 sm:p-5">
					<div className="flex flex-col items-center gap-3 mb-5">
						<img
							src={getSvgUrl({ theme: selectedTheme, seed, size: 320 })}
							alt="Avatar preview"
							className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full ring-2 ring-zinc-100"
							loading="lazy"
						/>

						<div className="w-full max-w-md flex items-center gap-2 px-1">
							<FireInput
								value={seed}
								onChange={(e) => setSeed(e.target.value)}
								placeholder="Customize seed..."
								className="flex-1 text-sm bg-slate-50"
								aria-label="Customize seed"
							/>
							<FireButton
								onClick={() => setSeed(randomSeed())}
								variant="outline"
								className="!p-2"
								aria-label="Randomize"
							>
								<HiRefresh className="w-4 h-4" />
							</FireButton>
						</div>
					</div>

					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
						{DICEBEAR_THEMES.map((theme) => {
							const isSelected = selectedTheme === theme.id;
							return (
								<button
									key={theme.id}
									type="button"
									title={theme.name}
									aria-pressed={isSelected}
									onClick={() => setSelectedTheme(theme.id)}
									className={`relative flex ring-2 flex-col items-center p-2 rounded-xl transition-transform transform focus:outline-none
                    ${isSelected ? 'scale-105 ring-blue-300 bg-blue-50' : 'ring-zinc-100 hover:ring-zinc-200 bg-white'}`}
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

									<p className="text-[11px] font-medium text-zinc-600 text-center truncate w-full px-1">
										{theme.name}
									</p>

									{isSelected && (
										<div className="absolute -top-1 -right-1 bg-slate-800 rounded-full p-0.5">
											<HiCheck className="w-3 h-3 text-white" />
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 px-4 py-3 ring-t ring-neutral-100 bg-neutral-50/50">
					<FireButton onClick={onClose} variant="secondary">
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
