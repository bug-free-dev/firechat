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

import { TAG_COLORS } from '@/app/components/UI';
import { FireButton, FireInput } from '@/app/components/UI';
import { FireToast } from '@/app/components/UI';
import { updateUserProfile } from '@/app/lib/api/userAPI';
import { useAuthState } from '@/app/lib/routing/context/AuthStateContext';
import { FireProfile } from '@/app/lib/types';

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
				toast.success('Profile updated');
			}
		} catch {
			toast.error('Failed to update profile');
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
		FireToast({
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
		<div className="w-full min-h-screen bg-white">
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
							saving={saving}
						/>

						<div className="w-full text-center lg:text-left space-y-1">
							<p className="text-md text-gray-500">@{profile.usernamey}</p>
							{isEditing ? (
								<input
									value={String(editData.displayName ?? '')}
									onChange={(e) =>
										setEditData({ ...editData, displayName: e.target.value })
									}
									placeholder="Display name"
									className="
                    w-70 p-1 text-md font-semibold text-gray-900 text-center lg:text-left
                    px-2 py-1 rounded-md bg-gray-50/50
                    ring-2 ring-gray-200/30 focus:ring-gray-300/50
                    outline-none transition-all
                  "
								/>
							) : (
								<h2 className="text-xl font-semibold text-gray-900">
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
                      inline-flex items-center gap-1 px-3 py-1.5 rounded-full 
                      text-xs font-medium ring-2
                      ${colorSet.bg} ${colorSet.text} ${colorSet.ring}
                      transition-all duration-200 hover:scale-105
                    `}
									>
										<span className="text-xs">★</span>
										{tag}
									</span>
								);
							})}
							{(profile.tags ?? []).length === 0 && (
								<span className="text-sm text-gray-400 italic">No tags yet</span>
							)}
						</div>
					</div>

					{/* Right Column - Detailed Info */}
					<div className="lg:col-span-2 space-y-6">
						{/* About */}
						<div>
							<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
								<HiOutlineInformationCircle className="w-5 h-5 text-blue-500" />
								About
							</label>
							{isEditing ? (
								<textarea
									value={String(editData.about ?? '')}
									onChange={(e) => setEditData({ ...editData, about: e.target.value })}
									placeholder="Tell people about yourself..."
									rows={5}
									className="
                    w-full px-4 py-3 rounded-lg 
                    bg-white ring-2 ring-gray-200/40
                    focus:ring-gray-300/60 outline-none resize-none text-sm transition-all
                  "
								/>
							) : (
								<div className="px-4 py-3 rounded-lg bg-gray-50/50 ring-2 ring-gray-100/50 text-sm text-gray-700">
									{profile.about || 'No bio yet'}
								</div>
							)}
						</div>

						{/* Mood & Status */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
									<HiOutlineEmojiHappy className="w-5 h-5 text-amber-500" />
									Mood
								</label>
								{isEditing ? (
									<MoodOptions
										value={String(editData.mood ?? '')}
										onChange={(val) => setEditData({ ...editData, mood: val })}
									/>
								) : (
									<div className="px-4 py-3 rounded-lg bg-gray-50/50 ring-2 ring-gray-100/50 text-sm text-gray-700">
										{profile.mood || 'No mood set'}
									</div>
								)}
							</div>

							<div>
								<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
									<HiOutlineHashtag className="w-5 h-5 text-blue-500" />
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
									<div className="px-4 py-3 rounded-lg bg-gray-50/50 ring-2 ring-gray-100/50 text-sm text-gray-700">
										{profile.status || 'No status'}
									</div>
								)}
							</div>
						</div>

						{/* Tags */}
						<div>
							<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
								<HiOutlineTag className="w-5 h-5 text-pink-500" />
								Tags
								<span className="text-xs text-gray-500">
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
							<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
								<HiOutlineStar className="w-5 h-5 text-violet-500" />
								Quirks
								<span className="text-xs text-gray-500">
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
										className="min-w-[120px]"
									>
										{saving ? 'Saving...' : 'Save changes'}
									</FireButton>
									<FireButton onClick={handleCancelEdit} variant="secondary">
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
