'use client';

import React from 'react';
import { FaBug, FaGhost, FaKey, FaLock, FaShieldAlt, FaUserSecret } from 'react-icons/fa';

import FireInput from '@/app/components/UI/FireInput';

type Props = {
	value: string;
	onChange: (v: string) => void;
	step?: number;
	total?: number;
};

export default function Sneaky({ value, onChange, step = 2, total = 7 }: Props) {
	return (
		<div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden">
			{/* Dark theme floating icons */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute right-5 top-5 text-[#6366f1] opacity-60">
					<FaGhost className="w-10 h-10 animate-float" />
				</div>

				<div className="absolute top-1/2 left-6 transform -translate-y-1/2 text-[#7c3aed] opacity-60">
					<FaLock className="w-11 h-11 animate-float-slow" />
				</div>
				<div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-[#5b21b6] opacity-50">
					<FaKey className="w-9 h-9 animate-pulse" style={{ animationDelay: '1s' }} />
				</div>
				<div className="absolute bottom-10 left-12 text-[#8b5cf6] opacity-60">
					<FaShieldAlt
						className="w-10 h-10 animate-float"
						style={{ animationDelay: '1.5s' }}
					/>
				</div>
				<div className="absolute bottom-12 right-16 text-[#6366f1] opacity-70">
					<FaBug className="w-9 h-9 animate-pulse" style={{ animationDelay: '2s' }} />
				</div>
			</div>

			<div className="relative z-10 max-w-2xl w-full mx-auto px-6 text-center">
				<div className="mb-12">
					<h1 className="font-dyna text-5xl lg:text-6xl text-neutral-900 inline-flex items-center justify-center gap-3 mb-3">
						<FaUserSecret className="text-[#8b5cf6] w-12 h-12 animate-pulse" />
						Sneaky
					</h1>
					<p className="font-righteous text-base text-neutral-500">
						Your secret identity in the chat world
					</p>
				</div>

				<div className="mb-10">
					<h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
						What is your secret code word?
					</h2>
					<p className="text-lg text-neutral-600">
						A special word only you know — keeps your chats extra secure.
					</p>
				</div>

				<div className="mb-8">
					<FireInput
						label=""
						value={value}
						onChange={onChange}
						placeholder="Enter your secret code word"
						className="text-xl py-5 text-center font-medium"
						type="password"
						showPasswordToggle
					/>
				</div>

				<div className="flex items-center justify-center gap-3 text-base text-neutral-500 mb-8">
					<FaLock className="text-purple-500 w-5 h-5 animate-pulse" />
					<span>Pro tip: mix letters, numbers, or symbols for extra sneakiness!</span>
				</div>

				<div className="flex items-center justify-center gap-3">
					<div className="w-3 h-3 rounded-full bg-[#8b5cf6] animate-pulse" />
					<span className="text-sm text-neutral-500 font-medium">
						Step {step} of {total}
					</span>
				</div>
			</div>
		</div>
	);
}
