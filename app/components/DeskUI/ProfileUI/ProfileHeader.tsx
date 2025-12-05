'use client';

import { useEffect, useRef, useState } from 'react';
import {
	HiOutlineDotsVertical,
	HiOutlineLogout,
	HiOutlineTrash,
	HiOutlineUser,
} from 'react-icons/hi';
import { RiUserSmileLine } from 'react-icons/ri';

type ProfileHeaderProps = {
	onLogout: () => void;
	onDeleteAccount: () => void;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onLogout, onDeleteAccount }) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuBtnRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				menuOpen &&
				menuRef.current &&
				!menuRef.current.contains(e.target as Node) &&
				menuBtnRef.current &&
				!menuBtnRef.current.contains(e.target as Node)
			) {
				setMenuOpen(false);
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [menuOpen]);

	return (
		<div className="relative border-b border-neutral-100 dark:border-neutral-800/50 bg-white dark:bg-neutral-950 px-6 py-8">
			<button
				ref={menuBtnRef}
				onClick={() => setMenuOpen((s) => !s)}
				className="
          absolute top-6 right-6 p-2 rounded-lg
          hover:bg-neutral-100 dark:hover:bg-neutral-800/50 
          transition-colors
        "
				aria-label="Open menu"
			>
				<HiOutlineDotsVertical className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
			</button>

			<div className="flex flex-col items-center text-center">
				<div className="flex items-center gap-2 mb-2">
					<HiOutlineUser className="w-7 h-7 text-red-500 dark:text-red-400" />
					<h1 className="text-3xl text-neutral-800 dark:text-rose-100 font-bubblegum">
						Profile
					</h1>
				</div>
				<p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
					<RiUserSmileLine className="w-5 h-5 text-rose-400 dark:text-rose-500" />
					Customize and share your vibes
				</p>
			</div>

			{menuOpen && (
				<div
					ref={menuRef}
					className="
            absolute top-16 right-6 w-48 
            bg-white dark:bg-neutral-950 
            border border-neutral-200 dark:border-neutral-700/40 
            rounded-lg shadow-lg dark:shadow-2xl dark:shadow-black/20 
            overflow-hidden z-50
          "
				>
					<button
						onClick={onLogout}
						className="
              w-full flex items-center gap-3 px-4 py-3 text-left text-sm
              hover:bg-neutral-50 dark:hover:bg-neutral-800/50 
              transition-colors
            "
					>
						<HiOutlineLogout className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
						<span className="text-neutral-700 dark:text-neutral-300">Sign out</span>
					</button>
					<button
						onClick={onDeleteAccount}
						className="
              w-full flex items-center gap-3 px-4 py-3 text-left text-sm
              hover:bg-red-50 dark:hover:bg-red-900/30 
              transition-colors 
              border-t border-neutral-100 dark:border-neutral-800/50
            "
					>
						<HiOutlineTrash className="w-4 h-4 text-red-600 dark:text-red-500" />
						<span className="text-red-600 dark:text-red-500">Delete account</span>
					</button>
				</div>
			)}
		</div>
	);
};
