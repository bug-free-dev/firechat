'use client';

import {
	PiAt,
	PiChat,
	PiChatCircle,
	PiClock,
	PiCode,
	PiGlobe,
	PiHeart,
	PiLightning,
	PiLink,
	PiLock,
	PiMagicWand,
	PiMoon,
	PiPalette,
	PiShield,
	PiSparkle,
	PiSun,
	PiTag,
	PiTrendUp,
	PiUserCircle,
	PiUsers,
} from 'react-icons/pi';

const icons = [
	PiChat,
	PiUsers,
	PiLock,
	PiSparkle,
	PiLightning,
	PiHeart,
	PiShield,
	PiMagicWand,
	PiGlobe,
	PiLink,
	PiCode,
	PiPalette,
	PiClock,
	PiTrendUp,
	PiMoon,
	PiSun,
	PiChatCircle,
	PiUserCircle,
	PiTag,
	PiAt,
];

export function IconGrid() {
	return (
		<section className="px-4 sm:px-6 py-16 sm:py-24">
			<div className="max-w-3xl mx-auto">
				<div className="text-center mb-12 sm:mb-16">
					<p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
						Everything you need
					</p>
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
						Built for conversation
					</h2>
				</div>

				<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
					{icons.map((Icon, idx) => (
						<div
							key={idx}
							className="flex items-center justify-center"
							style={{
								animation: 'fadeIn 0.5s ease-out',
								animationDelay: `${idx * 30}ms`,
								animationFillMode: 'both',
							}}
						>
							<div className="relative group">
								<div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
								<Icon className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors duration-200 relative z-10" />
							</div>
						</div>
					))}
				</div>
			</div>

			<style jsx>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</section>
	);
}
