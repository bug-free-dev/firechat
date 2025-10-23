'use client';

import React, { useState } from 'react';

import AuthForm from '@/app/components/FireupUI/AuthPanel';
import RightPanel from '@/app/components/FireupUI/FlarePanel';
import { FireDivider, FireHeader } from '@/app/components/UI';

export default function Page() {
	const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

	return (
		<main className="animate-slide-up min-h-screen relative overflow-hidden duration-200">
			<FireHeader variant="default" />

			<div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
				<div className="flex flex-col lg:flex-row lg:items-stretch gap-8 lg:gap-0 relative">
					<section className="flex-1 px-6 lg:px-8 py-8">
						<div className="max-w-md mx-auto">
							<AuthForm activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} />
						</div>
					</section>

					<div className="hidden lg:block w-16 relative">
						<FireDivider />
					</div>

					<aside className="flex-1 px-6 lg:px-8 py-8">
						<RightPanel />
					</aside>
				</div>
			</div>

			<footer className="bottom-0 absolute flex-row flex items-center justify-center w-full p-4 bg-gradient-to-t from-white to-transparent dark:from-transparent">
				<span className="text-neutral-500 text-lg font-jolly">
					Made with ❤️ Thanks for being here.
				</span>
			</footer>
		</main>
	);
}
