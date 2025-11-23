'use client';

import React from 'react';
import { toast } from 'react-hot-toast';
import { FiInfo, FiX } from 'react-icons/fi';

type ActionButton = {
	label: string;
	icon?: React.ReactNode;
	variant?: 'primary' | 'secondary' | 'danger';
	onClick: () => void;
};

type FireConfirmProps = {
	title?: string;
	message?: string;
	actions: ActionButton[];
};

export const confirm = ({ title, message, actions }: FireConfirmProps) => {
	const limited = actions?.length ? actions.slice(0, 3) : [];

	toast.custom(
		(t) => (
			<div
  role="status"
  aria-live="polite"
  className={`
    max-w-xs w-full
    bg-white/30 dark:bg-neutral-900
    text-slate-900 dark:text-neutral-50
    border border-neutral-200 dark:border-neutral-700/40
    backdrop-blur-md dark:backdrop-blur-md
    rounded-xl shadow-lg shadow-black/20
    overflow-hidden
    transform-gpu transition-all duration-250 ease-out
    ${t.visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
  `}
>
				{/* header */}
				<div className="flex items-center justify-between px-3 py-2">
					<div className="flex items-center gap-2">
						<div className="rounded-md p-[6px] bg-indigo-50 dark:bg-neutral-800">
							<FiInfo className="w-4 h-4 text-indigo-600 dark:text-white" />
						</div>

						<div className="flex flex-col">
							<span className="text-sm font-semibold leading-tight text-slate-900 dark:text-neutral-50">
								{title || 'Notice'}
							</span>
							{message && (
								<span className="text-[13px] mt-0.5 text-slate-600 dark:text-neutral-300 leading-tight">
									{message}
								</span>
							)}
						</div>
					</div>

					<button
						aria-label="Dismiss"
						onClick={() => toast.dismiss(t.id)}
						className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800/50 transition"
						title="Dismiss"
					>
						<FiX className="w-4 h-4 text-slate-500 dark:text-neutral-300" />
					</button>
				</div>

				{/* actions */}
				{limited.length > 0 && (
					<div className="px-3 pb-3 pt-1">
						<div className="flex gap-2 items-center justify-end flex-wrap">
							{limited.map((action, i) => {
								const base = 'inline-flex items-center justify-center rounded-md text-[13px] font-medium px-2.5 py-1 transition select-none';
								const style =
									action.variant === 'primary'
										? 'bg-indigo-600 text-white hover:bg-indigo-700'
										: action.variant === 'danger'
										? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-800 dark:text-rose-100 dark:hover:bg-rose-700'
										: 'bg-slate-50 text-slate-800 hover:bg-slate-100 dark:bg-neutral-700/40 dark:text-neutral-100 dark:hover:bg-neutral-700/60';

								return (
									<button
										key={i}
										onClick={() => {
											try { action.onClick(); } finally { toast.dismiss(t.id); }
										}}
										className={`${base} ${style}`}
										aria-label={action.label}
										title={action.label}
									>
										{action.icon && (
											<span className="flex items-center justify-center mr-1">{action.icon}</span>
										)}
										<span className="text-center">{action.label}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}
			</div>
		),
		{ position: 'top-center', duration: 4500 }
	);
};
