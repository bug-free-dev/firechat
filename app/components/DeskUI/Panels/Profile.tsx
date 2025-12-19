'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
	HiOutlineEmojiHappy,
	HiOutlineHashtag,
	HiOutlineInformationCircle,
	HiOutlineStar,
	HiOutlineTag,
} from 'react-icons/hi';

import { FireArea, FireButton, FireInput } from '@/app/components/UI';
import { confirm } from '@/app/components/UI';
import { updateUserProfile } from '@/app/lib/api/userAPI';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import type { FireProfile } from '@/app/lib/types';

import {
	MoodOptions,
	ProfileAvatarSection,
	ProfileHeader,
	ProfileStats,
	QuirkInput,
	TagInput,
} from '../ProfileUI';

interface ProfilePanelProps {
	profile: FireProfile;
	onUpdate: (updates: Partial<FireProfile>) => void;
}

const MAX_IMAGE_SIZE = 100 * 1024;

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ profile, onUpdate }) => {
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
		toast('Changes discarded');
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
		} finally {
			setSaving(false);
		}
	};

	const compressImage = (img: HTMLImageElement, callback: (compressedData: string) => void) => {
		const canvas = document.createElement('canvas');
		let width = img.width;
		let height = img.height;

		const maxDimension = 400;
		if (width > height && width > maxDimension) {
			height = (height * maxDimension) / width;
			width = maxDimension;
		} else if (height > maxDimension) {
			width = (width * maxDimension) / height;
			height = maxDimension;
		}

		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.drawImage(img, 0, 0, width, height);
			const compressedData = canvas.toDataURL('image/jpeg', 0.8);
			callback(compressedData);
		}
	};

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please select a valid image file');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image size should be less than 5MB');
			return;
		}

		const reader = new FileReader();

		reader.onerror = () => {
			toast.error('Failed to read image file');
		};

		reader.onload = () => {
			const result = reader.result as string;

			if (result.length > MAX_IMAGE_SIZE) {
				const img = new Image();
				img.onload = () => {
					compressImage(img, (compressedData) => {
						setEditData((prev) => ({ ...prev, avatarUrl: compressedData }));
						toast.success('Image compressed and uploaded');
					});
				};
				img.onerror = () => {
					toast.error('Failed to process image');
				};
				img.src = result;
			} else {
				setEditData((prev) => ({ ...prev, avatarUrl: result }));
				toast.success('Image uploaded successfully');
			}
		};

		reader.readAsDataURL(file);
	};

	const handleDicebearSelect = (url: string) => {
		setEditData((prev) => ({ ...prev, avatarUrl: url }));
		toast.success('Avatar style selected! 🎨');
	};

	const handleLogout = () => {
		confirm({
			title: 'Sign Out',
			message: 'Are you sure you want to sign out?',
			actions: [
				{ label: 'Cancel', variant: 'secondary', onClick: () => {} },
				{
					label: 'Sign out',
					variant: 'primary',
					onClick: async () => {
						try {
							await logout();
							toast.success('Signed out successfully');
						} catch {
							toast.error('Failed to sign out');
						}
					},
				},
			],
		});
	};

	const handleDeleteAccount = () => {
		confirm({
			title: 'Delete Account',
			message:
				'This action cannot be undone. Your account and all data will be permanently deleted.',
			actions: [
				{ label: 'Cancel', variant: 'secondary', onClick: () => {} },
				{
					label: 'Delete',
					variant: 'danger',
					onClick: async () => {
						try {
							await deleteAndLogout();
							toast.success('Account deleted');
						} catch {
							toast.error('Failed to delete account');
						}
					},
				},
			],
		});
	};

	return (
		<div className="min-h-screen bg-white dark:bg-zinc-950">
			<ProfileHeader onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />

			{/* Hero Section */}
			<div className="relative">
				<div className="absolute inset-0 bg-gradient-to-br from-zinc-100/40 via-transparent to-zinc-100/40 dark:from-zinc-900/20 dark:to-zinc-900/20 pointer-events-none" />

				<div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16">
					{/* Avatar & Identity */}
					<div className="flex flex-col items-center">
						<div className="relative">
							<div className="absolute -inset-8 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800/50 rounded-full blur-3xl opacity-60" />
							<div className="relative">
								<ProfileAvatarSection
									displayName={profile.displayName}
									avatarUrl={isEditing ? editData.avatarUrl : profile.avatarUrl}
									isEditing={isEditing}
									onEdit={() => setIsEditing(true)}
									onCancel={handleCancelEdit}
									onSave={handleSave}
									onImageUpload={handleImageUpload}
									onDicebearSelect={handleDicebearSelect}
									saving={saving}
								/>
							</div>
						</div>

						<div className="mt-10 text-center space-y-3">
							<p className="text-[13px] tracking-wide text-zinc-500 dark:text-zinc-500 font-medium">
								@{profile.usernamey}
							</p>

							{isEditing ? (
								<input
									value={String(editData.displayName ?? '')}
									onChange={(e) =>
										setEditData({ ...editData, displayName: e.target.value })
									}
									placeholder="Display name"
									className="text-4xl font-semibold tracking-tight text-center text-zinc-900 dark:text-zinc-100
                              bg-transparent border-b-2 border-zinc-200 dark:border-zinc-600
                              focus:border-zinc-800/60 dark:focus:border-zinc-100/50
                              outline-none transition-all px-6 py-2 placeholder:text-zinc-300"
								/>
							) : (
								<h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
									{profile.displayName}
								</h1>
							)}
						</div>

						<div className="mt-8">
							<ProfileStats kudos={profile.kudos ?? 0} status={profile.status} />
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-5xl mx-auto px-6 pb-24">
				<div className="grid lg:grid-cols-[280px_1fr] gap-12">
					{/* Sidebar */}
					<aside className="space-y-8">
						{/* Mood Card */}
						<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-6   ">
							<div className="flex items-center gap-2 mb-4">
								<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 flex items-center justify-center">
									<HiOutlineEmojiHappy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
								</div>
								<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									Mood
								</h3>
							</div>
							{isEditing ? (
								<MoodOptions
									value={String(editData.mood ?? '')}
									onChange={(val) => setEditData({ ...editData, mood: val })}
								/>
							) : (
								<p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
									{profile.mood || 'Not set'}
								</p>
							)}
						</div>

						{/* Status Card */}
						<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-6   ">
							<div className="flex items-center gap-2 mb-4">
								<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 flex items-center justify-center">
									<HiOutlineHashtag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								</div>
								<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									Status
								</h3>
							</div>
							{isEditing ? (
								<FireInput
									value={String(editData.status ?? '')}
									onChange={(e) => setEditData({ ...editData, status: e.target.value })}
									placeholder="What's your status?"
									size="sm"
								/>
							) : (
								<p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
									{profile.status || 'No status'}
								</p>
							)}
						</div>
					</aside>

					{/* Main Content Area */}
					<main className="space-y-8">
						{/* About Section */}
						<section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-8 ">
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 flex items-center justify-center">
									<HiOutlineInformationCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
								</div>
								<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
									About
								</h2>
							</div>
							{isEditing ? (
								<FireArea
									value={String(editData.about ?? '')}
									onChange={(e) => setEditData({ ...editData, about: e.target.value })}
									placeholder="Tell people about yourself..."
									rows={4}
								/>
							) : (
								<p className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
									{profile.about || 'No bio yet'}
								</p>
							)}
						</section>

						{/* Tags Section */}
						<section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-8   ">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 flex items-center justify-center">
										<HiOutlineTag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
									</div>
									<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
										Tags
									</h2>
								</div>
								<span className="text-sm text-zinc-500 dark:text-zinc-500 font-medium">
									{(editData.tags ?? []).length}/12
								</span>
							</div>
							<TagInput
								value={editData.tags ?? []}
								onChange={(next) => setEditData({ ...editData, tags: next })}
								placeholder="e.g. React, Design, Photography"
								max={12}
								editable={isEditing}
							/>
						</section>

						{/* Quirks Section */}
						<section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-8   ">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20 flex items-center justify-center">
										<HiOutlineStar className="w-5 h-5 text-rose-600 dark:text-rose-400" />
									</div>
									<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
										Quirks
									</h2>
								</div>
								<span className="text-sm text-zinc-500 dark:text-zinc-500 font-medium">
									{(editData.quirks ?? []).length}/6
								</span>
							</div>
							<QuirkInput
								value={editData.quirks ?? []}
								onChange={(next) => setEditData({ ...editData, quirks: next })}
								placeholder="e.g. Night Owl, Coffee Addict"
								max={6}
								editable={isEditing}
							/>
						</section>

						{/* Action Footer */}
						<div className="flex gap-3 pt-2">
							{isEditing ? (
								<>
									<FireButton
										onClick={handleSave}
										variant="default"
										disabled={saving}
										loading={saving}
									>
										Save changes
									</FireButton>
									<FireButton onClick={handleCancelEdit} variant="outline" destructive>
										Cancel
									</FireButton>
								</>
							) : (
								<FireButton onClick={() => setIsEditing(true)} variant="default">
									Edit profile
								</FireButton>
							)}
						</div>
					</main>
				</div>
			</div>
		</div>
	);
};
