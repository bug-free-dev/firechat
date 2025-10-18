'use client';
import { useState } from 'react';
import {
	FaAngry,
	FaCloudSun,
	FaCoffee,
	FaGamepad,
	FaGhost,
	FaGrinStars,
	FaHeart,
	FaLaughSquint,
	FaMusic,
	FaPizzaSlice,
	FaRocket,
	FaSadTear,
	FaSmile,
} from 'react-icons/fa';

import FireButton from '@/app/components/UI/FireButton';
import FireInput from '@/app/components/UI/FireInput';

type FireOptionProps = {
	value: string;
	onChange: (val: string) => void;
};

export const moods = [
	{ label: 'Happy', icon: <FaSmile className="text-yellow-400" /> },
	{ label: 'Chill', icon: <FaCoffee className="text-brown-500" /> },
	{ label: 'Excited', icon: <FaGrinStars className="text-green-400" /> },
	{ label: 'Sad', icon: <FaSadTear className="text-blue-400" /> },
	{ label: 'Angry', icon: <FaAngry className="text-red-500" /> },
	{ label: 'Romantic', icon: <FaHeart className="text-pink-500" /> },
	{ label: 'Hungry', icon: <FaPizzaSlice className="text-orange-400" /> },
	{ label: 'Musical', icon: <FaMusic className="text-indigo-400" /> },
	{ label: 'Gaming', icon: <FaGamepad className="text-purple-500" /> },
	{ label: 'Dreamy', icon: <FaCloudSun className="text-amber-500" /> },
	{ label: 'Spooky', icon: <FaGhost className="text-gray-500" /> },
	{ label: 'Rocket Mode', icon: <FaRocket className="text-lime-500" /> },
	{ label: 'Goofy', icon: <FaLaughSquint className="text-pink-400" /> },
];

export default function FireOption({ value, onChange }: FireOptionProps) {
	const [custom, setCustom] = useState('');

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{moods.map((mood) => (
					<button
						key={mood.label}
						onClick={() => onChange(mood.label)}
						className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200
              ${
						value === mood.label
							? 'bg-lime-100 border-lime-400 text-lime-700'
							: 'bg-white border-neutral-200 hover:border-lime-300 hover:bg-lime-50'
					}`}
					>
						{mood.icon}
						{mood.label}
					</button>
				))}
			</div>

			{/* Custom mood input */}
			<div className="mt-4 flex flex-col sm:flex-row gap-2">
				<FireInput
					value={custom}
					onChange={(e) => setCustom(e.target.value)}
					placeholder="Or set your own mood..."
					className="flex-1 rounded-t-lg  ml-2"
				/>
				<FireButton
					variant="secondary"
					onClick={() => {
						if (custom.trim()) onChange(custom);
					}}
					disabled={!custom.trim()}
					className="ml-2"
				>
					Set Mood
				</FireButton>
			</div>
		</div>
	);
}
