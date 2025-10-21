'use client';

import React from 'react';
import {
	RiKeyLine,
	RiLockLine,
	RiShieldKeyholeLine,
	RiShieldLine,
	RiSpyLine,
} from 'react-icons/ri';

import { FireInput } from '@/app/components/UI';

type SneakyProps = {
	value: string;
	onChange: (v: string) => void;
	step?: number;
	total?: number;
};

export function Sneaky({ value, onChange, step = 2, total = 7 }: SneakyProps) {
	return (
		<div className="relative w-full h-full min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
			{/* Floating Icons */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[10%] right-[8%] text-purple-400/40">
					<RiSpyLine className="w-11 h-11 animate-float-elegant" />
				</div>
				<div className="absolute top-[50%] left-[5%] -translate-y-1/2 text-indigo-400/35">
					<RiLockLine className="w-12 h-12 animate-drift" />
				</div>
				<div className="absolute top-[55%] right-[6%] -translate-y-1/2 text-purple-300/30">
					<RiKeyLine className="w-10 h-10 animate-bounce" style={{ animationDelay: '1s' }} />
				</div>
				<div className="absolute bottom-[12%] left-[10%] text-violet-400/35">
					<RiShieldLine
						className="w-11 h-11 animate-float-elegant"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
			</div>

			<div className="mt-1 relative z-10 max-w-2xl w-full mx-auto px-6 text-center animate-slide-up">
				<div className="mb-14">
					<h1 className="font-comic text-5xl lg:text-6xl text-slate-900 inline-flex items-center justify-center gap-3 mb-4">
						<RiShieldKeyholeLine className="text-purple-500 w-12 h-12 animate-pulse-soft" />
						Sneaky
					</h1>
					<p className="font-righteous text-base text-slate-500">
						Your secret identity in the chat world
					</p>
				</div>

				<div className="mb-12">
					<h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-5">
						What is your secret code word?
					</h2>
					<p className="text-base text-slate-500 font-righteous">
						A special word only you know — keeps your chats extra secure.
					</p>
				</div>

				<div className="mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
					<FireInput
						variant="custom"
						label=""
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Enter your secret code word"
						showPasswordToggle
						type="password"
					/>
				</div>

				<div
					className="flex items-center justify-center gap-3 text-base text-slate-500 mb-10 animate-fade-in"
					style={{ animationDelay: '0.2s' }}
				>
					<RiLockLine className="text-purple-500 w-5 h-5 animate-pulse-soft" />
					<span>Pro tip: mix letters, numbers, or symbols for extra sneakiness!</span>
				</div>

				<div
					className="flex items-center justify-center gap-3 animate-fade-in"
					style={{ animationDelay: '0.3s' }}
				>
					<div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse-soft" />
					<span className="text-sm text-slate-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
