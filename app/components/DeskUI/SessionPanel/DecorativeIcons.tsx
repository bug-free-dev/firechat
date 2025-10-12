'use client';

import React from 'react';
import { FaFire, FaHeart, FaMagic, FaRocket, FaStar } from 'react-icons/fa';

export function DecorativeIcons() {
	return (
		<>
			<FaStar className="absolute top-20 left-8 w-5 h-5 text-yellow-400 animate-float opacity-30" />
			<FaHeart className="absolute top-22 right-12 w-6 h-6 text-rose-400 animate-pulse opacity-30" />
			<FaRocket className="absolute bottom-40 left-16 w-7 h-7 text-lime-400 animate-float-slow opacity-30" />
			<FaMagic className="absolute bottom-24 right-20 w-5 h-5 text-purple-400 animate-bounce opacity-30" />
			<FaFire className="absolute top-1/2 left-12 w-6 h-6 text-orange-400 animate-float opacity-30" />
		</>
	);
}
