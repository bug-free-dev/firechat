'use client';

import React from 'react';
import {
	IoSparklesOutline,
	IoRocketOutline,
	IoStarOutline,
	IoPlanetOutline,
} from 'react-icons/io5';

export function DecorativeIcons() {
	return (
		<>
			<IoStarOutline className="absolute top-16 left-6 w-5 h-5 text-yellow-400 animate-float opacity-30" />
			<IoRocketOutline className="absolute bottom-36 left-20 w-7 h-7 text-lime-400 animate-float-slow opacity-30" />
			<IoSparklesOutline className="absolute bottom-24 right-16 w-5 h-5 text-purple-400 animate-bounce opacity-30" />
			<IoPlanetOutline className="absolute top-10 right-10 w-6 h-6 text-blue-400 animate-float-slow opacity-25" />
		</>
	);
}
