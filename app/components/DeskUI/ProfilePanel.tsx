'use client';

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BiImageAdd } from 'react-icons/bi';
import {
	FiEdit,
	FiHash,
	FiInfo,
	FiLogOut,
	FiMoreVertical,
	FiSave,
	FiSmile,
	FiStar,
	FiTag,
	FiTrash2,
	FiX,
} from 'react-icons/fi';
import { RiUserLine } from 'react-icons/ri';

import FireAvatar from '@/app/components/UI/FireAvatar';
import FireButton from '@/app/components/UI/FireButton';
import FireInput from '@/app/components/UI/FireInput';
import FireOption from '@/app/components/UI/FireOption';
import { FireToast } from '@/app/components/UI/FireToast';
import TagInput from '@/app/components/UI/TagInput';
import { updateUserProfile } from '@/app/lib/api/userAPI';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import { FireProfile } from '@/app/lib/types';

interface ProfilePanelProps {
	profile: FireProfile;
	onUpdate: (updates: Partial<FireProfile>) => void;
}

export default function ProfilePanel({ profile, onUpdate }: ProfilePanelProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const { logout, deleteAndLogout } = useAuthState();

	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editData, setEditData] = useState<Partial<FireProfile>>({
		displayName: profile.displayName ?? '',
		status: profile.status ?? '',
		about: profile.about ?? '',
		mood: profile.mood ?? '',
		tags: profile.tags ?? [],
		quirks: profile.quirks ?? [],
		avatarUrl: profile.avatarUrl ?? '',
	});

	const [menuOpen, setMenuOpen] = useState(false);
	const menuBtnRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isEditing) {
			setEditData({
				displayName: profile.displayName ?? '',
				status: profile.status ?? '',
				about: profile.about ?? '',
				mood: profile.mood ?? '',
				tags: profile.tags ?? [],
				quirks: profile.quirks ?? [],
				avatarUrl: profile.avatarUrl ?? '',
			});
		}
	}, [profile, isEditing]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (menuOpen) {
				if (
					menuRef.current &&
					!menuRef.current.contains(target) &&
					menuBtnRef.current &&
					!menuBtnRef.current.contains(target)
				) {
					setMenuOpen(false);
				}
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [menuOpen]);

	const handleCancelEdit = () => {
		setEditData({
			displayName: profile.displayName ?? '',
			status: profile.status ?? '',
			about: profile.about ?? '',
			mood: profile.mood ?? '',
			tags: profile.tags ?? [],
			quirks: profile.quirks ?? [],
			avatarUrl: profile.avatarUrl ?? '',
		});
		setIsEditing(false);
		toast('Edits discarded');
	};

	const handleSave = async () => {
		if (!profile?.uid) return;
		setSaving(true);
		try {
			const success = await updateUserProfile(profile.uid, {
				displayName: String(editData.displayName ?? ''),
				status: String(editData.status ?? ''),
				about: String(editData.about ?? ''),
				mood: String(editData.mood ?? ''),
				tags: editData.tags ?? [],
				quirks: editData.quirks ?? [],
				avatarUrl: String(editData.avatarUrl ?? ''),
			});
			if (success) {
				onUpdate(editData);
				setIsEditing(false);
			}
		} catch {
			/** Parent handles it */
		} finally {
			setSaving(false);
		}
	};

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setEditData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleLogout = () => {
		FireToast({
			title: 'Sign Out',
			message: 'Are you sure you want to sign out?',
			actions: [
				{
					label: 'Cancel',
					variant: 'secondary',
					onClick: () => setMenuOpen(false),
				},
				{
					label: 'Logout',
					variant: 'primary',
					onClick: async () => {
						try {
							await logout();
							toast.success('Logged out successfully');
						} catch {
							toast.error('Failed to sign out');
						} finally {
							setMenuOpen(false);
						}
					},
				},
			],
		});
	};

	const handleDeleteAccount = () => {
		FireToast({
			title: 'Delete Account',
			message: 'Deleting your account is permanent. Continue?',
			actions: [
				{
					label: 'Cancel',
					variant: 'secondary',
					onClick: () => setMenuOpen(false),
				},
				{
					label: 'Delete',
					variant: 'danger',
					onClick: async () => {
						try {
							await deleteAndLogout();
							toast.success('Account deleted successfully');
						} catch {
							toast.error('Failed to delete account');
						} finally {
							setMenuOpen(false);
						}
					},
				},
			],
		});
	};

	return (
		<div className="relative w-full min-h-[680px] bg-white overflow-hidden">
			<div className="relative w-full px-8 py-6 border-b border-neutral-100">
				<button
					ref={menuBtnRef}
					onClick={() => setMenuOpen((s) => !s)}
					className="absolute top-6 right-8 p-3 rounded-full bg-neutral-100 hover:bg-neutral-200 transition"
					aria-haspopup="true"
					aria-expanded={menuOpen}
					aria-label="Open profile actions"
				>
					<FiMoreVertical />
				</button>

				<div className="flex flex-col items-center text-center">
					<h2 className="text-3xl font-dyna font-semibold text-neutral-800 flex items-center gap-3 justify-center">
						<RiUserLine className="text-[#ff3e00]" />
						Profile
					</h2>
					<p className="text-sm text-neutral-500 mt-1 flex items-center justify-center">
						<FiSmile className="inline-block mr-2 text-yellow-500" />
						Show your vibe — be kind.
					</p>
				</div>

				{menuOpen && (
					<div
						ref={menuRef}
						className="absolute top-16 right-8 w-48 bg-white border border-neutral-200 rounded-md shadow-lg z-40"
						role="menu"
					>
						<button
							onClick={handleLogout}
							className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-neutral-50"
						>
							<FiLogOut className="w-4 h-4" />
							Logout
						</button>
						<button
							onClick={handleDeleteAccount}
							className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-neutral-50 text-rose-600"
						>
							<FiTrash2 className="w-4 h-4" />
							Delete account
						</button>
					</div>
				)}
			</div>

			<div className="w-full px-8 py-8">
				<div className="flex flex-col lg:flex-row gap-8">
					<div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start gap-6 relative">
						<div className="relative">
							<div className="rounded-full overflow-hidden p-1 bg-gradient-to-tr from-neutral-100 to-neutral-50">
								<FireAvatar
									seed={profile.displayName || 'Firechat'}
									src={isEditing ? editData?.avatarUrl : profile?.avatarUrl}
									size={220}
									background="#fafafa"
									className="shadow-xl"
								/>
							</div>

							<div className="absolute left-2 bottom-2">
								{isEditing ? (
									<div
										className="fc-btn-group fc-slide-in-left"
										role="group"
										aria-label="Profile edit actions"
									>
										<button
											type="button"
											onClick={handleCancelEdit}
											className="fc-btn fc-btn--outline"
											title="Cancel edits"
											aria-label="Cancel edits"
											data-i={0}
										>
											<FiX />
										</button>

										<button
											type="button"
											onClick={handleSave}
											className="fc-btn fc-btn--primary"
											disabled={saving}
											title="Save profile"
											aria-label="Save profile"
											data-i={1}
										>
											<FiSave />
										</button>

										<label title="Upload avatar" className="m-0">
											<input
												ref={fileInputRef}
												id="avatar-upload"
												type="file"
												accept="image/*"
												onChange={handleImageUpload}
												className="hidden"
												aria-hidden
											/>
											<button
												type="button"
												className="fc-btn"
												title="Upload avatar"
												aria-label="Upload avatar"
												data-i={2}
												onClick={() => fileInputRef.current?.click()}
											>
												<BiImageAdd />
											</button>
										</label>
									</div>
								) : (
									<div className="fc-btn-group">
										<button
											type="button"
											onClick={() => setIsEditing(true)}
											className="fc-btn fc-btn--muted fc-slide-in-left"
											title="Edit profile"
											aria-label="Edit profile"
											data-i={0}
										>
											<FiEdit />
										</button>
									</div>
								)}
							</div>
						</div>

						<div className="text-center lg:text-left w-full">
							{isEditing ? (
								<input
									value={String(editData.displayName ?? '')}
									onChange={(e) =>
										setEditData({ ...editData, displayName: e.target.value })
									}
									placeholder="Display name"
									className="flex-1 text-sm  bg-neutral-100/50 focus:bg-white focus:ring-neutral-300 ring-2 ring-neutral-100 px-2 py-2 
                           rounded-sm focus:outline-none  border-none transition-all max-w-[150px]"
								/>
							) : (
								<h3 className="text-2xl font-semibold text-neutral-800">
									{profile.displayName}
								</h3>
							)}
							<p className="text-sm text-neutral-500">@{profile.usernamey}</p>
						</div>

						<div className="flex items-center gap-6 mt-3 text-sm text-neutral-700">
							<div className="flex items-center gap-1">
								<FiStar className="text-yellow-500 w-4 h-4" />
								<span className="font-medium">{profile.kudos ?? 0}</span>
								<span className="text-xs text-neutral-400 ml-1">kudos</span>
							</div>

							<div className="flex items-center gap-1 text-neutral-600">
								<FiHash className="w-4 h-4 text-blue-500" />
								<span className="text-xs">{profile.status || 'No status'}</span>
							</div>
						</div>

						<div className="flex flex-wrap gap-2 mt-3 justify-center lg:justify-start">
							{(profile.tags ?? []).slice(0, 10).map((t, i) => {
								const colors = [
									'bg-rose-600/20 text-rose-500',
									'bg-amber-600/20 text-amber-500',
									'bg-emerald-600/20 text-emerald-500',
									'bg-sky-600/20 text-sky-500',
									'bg-violet-600/20 text-violet-500',
									'bg-pink-600/20 text-pink-500',
									'bg-indigo-600/20 text-indigo-500',
									'bg-teal-600/20 text-teal-500',
									'bg-orange-600/20 text-orange-500',
									'bg-lime-600/20 text-lime-500',
								];
								const colorClass = colors[i % colors.length];

								return (
									<span
										key={i}
										className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass} flex items-center gap-1 transition-all duration-200 hover:scale-105`}
									>
										<span className="text-sm">★</span>
										{t}
									</span>
								);
							})}
						</div>
					</div>

					<div className="w-full lg:w-2/3">
						<div className="mb-6">
							<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
								<FiInfo className="text-lime-500" />
								About
							</label>

							{isEditing ? (
								<textarea
									value={String(editData.about ?? '')}
									onChange={(e) => setEditData({ ...editData, about: e.target.value })}
									placeholder="Tell people about you..."
									rows={6}
									className="w-full px-6 py-3 bg-neutral-50 border border-neutral-200 rounded-md resize-none focus:ring-2 focus:ring-neutral-200 outline-none text-sm"
								/>
							) : (
								<div className="text-neutral-700 text-sm bg-neutral-50 px-6 py-3 rounded-lg border border-neutral-100">
									{profile.about || 'No bio yet'}
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
									<FiSmile className="text-yellow-500" />
									Mood
								</label>
								{isEditing ? (
									<FireOption
										value={String(editData.mood ?? '')}
										onChange={(val) => setEditData({ ...editData, mood: val })}
									/>
								) : (
									<div className="text-neutral-700 text-sm bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-100">
										{profile.mood || 'No mood set'}
									</div>
								)}
							</div>

							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
									<FiHash className="text-blue-500" />
									Status
								</label>
								{isEditing ? (
									<FireInput
										value={String(editData.status ?? '')}
										onChange={(e) => setEditData({ ...editData, status: e.target.value })}
										placeholder="Short status"
										className="w-full"
									/>
								) : (
									<div className="text-neutral-700 text-sm bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-100">
										{profile.status || 'No status'}
									</div>
								)}
							</div>
						</div>

						<div className="mb-6">
							<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
								<FiTag className="text-pink-500" />
								Tags ({(editData.tags ?? []).length}/12)
							</label>

							<TagInput
								value={editData.tags ?? []}
								onChange={(next) => setEditData({ ...editData, tags: next })}
								placeholder="Add tags (press Enter)"
								max={12}
								prefix=""
								editable={isEditing}
							/>
						</div>

						<div className="mb-6">
							<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
								<FiStar className="text-yellow-400" />
								Quirks ({(editData.quirks ?? []).length}/6)
							</label>

							<TagInput
								value={editData.quirks ?? []}
								onChange={(next) => setEditData({ ...editData, quirks: next })}
								placeholder="Add quirks (press Enter)"
								max={6}
								prefix=""
								editable={isEditing}
							/>
						</div>

						<div className="mt-6 flex gap-3">
							{isEditing ? (
								<>
									<FireButton onClick={handleSave} variant="default" disabled={saving}>
										{saving ? 'Saving...' : 'Save Changes'}
									</FireButton>
									<FireButton onClick={handleCancelEdit} variant="secondary">
										Cancel
									</FireButton>
								</>
							) : (
								<FireButton onClick={() => setIsEditing(true)} variant="default">
									Edit profile
								</FireButton>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
