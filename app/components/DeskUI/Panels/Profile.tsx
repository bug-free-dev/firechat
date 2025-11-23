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
import { IoSparkles } from 'react-icons/io5';
import { RiPriceTag3Line } from 'react-icons/ri';

import { TAG_COLORS } from '@/app/components/UI';
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
	TagInput,
} from '../ProfileUI';

interface ProfilePanelProps {
	profile: FireProfile;
	onUpdate: (updates: Partial<FireProfile>) => void;
}

const MAX_IMAGE_SIZE = 100 * 1024; // 100KB for base64 strings

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
		<div className="w-full min-h-screen bg-white dark:bg-neutral-900">
			<ProfileHeader onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />

			<div className="max-w-5xl mx-auto px-6 py-12">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
					{/* Left Column - Avatar & Basic Info */}
					<div className="lg:col-span-1 flex flex-col items-center lg:items-start gap-6">
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

						<div className="w-full text-center lg:text-left space-y-1">
							<p className="text-md text-neutral-500 dark:text-neutral-400">
								@{profile.usernamey}
							</p>
							{isEditing ? (
								<input
									value={String(editData.displayName ?? '')}
									onChange={(e) =>
										setEditData({ ...editData, displayName: e.target.value })
									}
									placeholder="Display name"
									className="
                    w-50 p-1 text-md font-semibold text-neutral-900 dark:text-neutral-100 text-center lg:text-left
                    px-2 py-1 rounded-md bg-neutral-50/50 dark:bg-neutral-800/50
                    ring-2 ring-neutral-200/30 dark:ring-neutral-700/40 focus:ring-neutral-300/50 dark:focus:ring-neutral-600/50
                    outline-none transition-all
                  "
								/>
							) : (
								<h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
									{profile.displayName}
								</h2>
							)}
						</div>

						<ProfileStats kudos={profile.kudos ?? 0} status={profile.status} />

						{/* Tags Display */}
						<div className="flex flex-wrap gap-2 justify-center lg:justify-start">
							{(profile.tags ?? []).slice(0, 10).map((tag, i) => {
								const colorSet = TAG_COLORS[i % TAG_COLORS.length];
								return (
									<span
										key={i}
										className={`
											inline-flex items-center gap-2 pl-3 pr-3 py-1
											rounded-xl ${colorSet.bg} ${colorSet.text} ${colorSet.ring}
											dark:${colorSet.bg} dark:${colorSet.text} dark:${colorSet.ring}
											text-sm font-medium tracking-tight
											transition-all duration-200 ease-out ${colorSet.hover}
											dark:hover:shadow-lg dark:hover:shadow-black/10
										`}
									>
										<RiPriceTag3Line className="w-3.5 h-3.5 opacity-60" />
										{tag}
									</span>
								);
							})}
							{(profile.tags ?? []).length === 0 && (
								<div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
									<IoSparkles className="w-4 h-4 opacity-30" />
									<span className="text-sm">No tags yet</span>
								</div>
							)}
						</div>
					</div>

					{/* Right Column - Detailed Info */}
					<div className="lg:col-span-2 space-y-6">
						{/* About */}
						<div>
							<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
								<HiOutlineInformationCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
								About
							</label>
							{isEditing ? (
								<FireArea
									value={String(editData.about ?? '')}
									onChange={(e) => setEditData({ ...editData, about: e.target.value })}
									placeholder="Tell people about yourself..."
									rows={4}
								/>
							) : (
								<div className="px-4 py-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/50 ring-2 ring-neutral-100/50 dark:ring-neutral-800/50 text-sm text-neutral-700 dark:text-neutral-300">
									{profile.about || 'No bio yet'}
								</div>
							)}
						</div>

						{/* Mood & Status */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
									<HiOutlineEmojiHappy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
									Mood
								</label>
								{isEditing ? (
									<MoodOptions
										value={String(editData.mood ?? '')}
										onChange={(val) => setEditData({ ...editData, mood: val })}
									/>
								) : (
									<div className="px-4 py-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/50 ring-2 ring-neutral-100/50 dark:ring-neutral-800/50 text-sm text-neutral-700 dark:text-neutral-300">
										{profile.mood || 'No mood set'}
									</div>
								)}
							</div>

							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
									<HiOutlineHashtag className="w-5 h-5 text-blue-500 dark:text-blue-400" />
									Status
								</label>
								{isEditing ? (
									<FireInput
										value={String(editData.status ?? '')}
										onChange={(e) => setEditData({ ...editData, status: e.target.value })}
										placeholder="What's your status?"
										className="w-full"
									/>
								) : (
									<div className="px-4 py-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/50 ring-2 ring-neutral-100/50 dark:ring-neutral-800/50 text-sm text-neutral-700 dark:text-neutral-300">
										{profile.status || 'No status'}
									</div>
								)}
							</div>
						</div>

						{/* Tags */}
						<div>
							<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
								<HiOutlineTag className="w-5 h-5 text-pink-500 dark:text-pink-400" />
								Tags
								<span className="text-xs text-neutral-500 dark:text-neutral-400">
									({(editData.tags ?? []).length}/12)
								</span>
							</label>
							<TagInput
								value={editData.tags ?? []}
								onChange={(next) => setEditData({ ...editData, tags: next })}
								placeholder="Add a tag..."
								max={12}
								editable={isEditing}
							/>
						</div>

						{/* Quirks */}
						<div>
							<label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
								<HiOutlineStar className="w-5 h-5 text-violet-500 dark:text-violet-400" />
								Quirks
								<span className="text-xs text-neutral-500 dark:text-neutral-400">
									({(editData.quirks ?? []).length}/6)
								</span>
							</label>
							<TagInput
								value={editData.quirks ?? []}
								onChange={(next) => setEditData({ ...editData, quirks: next })}
								placeholder="Add a quirk..."
								max={6}
								editable={isEditing}
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 pt-4">
							{isEditing ? (
								<>
									<FireButton
										onClick={handleSave}
										variant="default"
										disabled={saving}
										loading={saving}
										className="min-w-[120px]"
									>
										Save changes
									</FireButton>
									<FireButton onClick={handleCancelEdit} variant="outline">
										Cancel
									</FireButton>
								</>
							) : (
								<FireButton
									onClick={() => setIsEditing(true)}
									variant="default"
									className="min-w-[120px]"
								>
									Edit profile
								</FireButton>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
