'use client';

import { useEffect, useRef, useState } from 'react';
import { BiImageAdd } from 'react-icons/bi';
import { HiOutlinePencil, HiOutlinePhotograph, HiOutlineSave, HiOutlineX } from 'react-icons/hi';
import { RiRobot2Line } from 'react-icons/ri';

import { DiceAvatarPicker, FireAvatar } from '@/app/components/UI';

type ProfileAvatarSectionProps = {
	displayName: string;
	avatarUrl?: string | null;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSave: () => void;
	onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDicebearSelect: (url: string) => void;
	saving: boolean;
};

export const ProfileAvatarSection: React.FC<ProfileAvatarSectionProps> = ({
	displayName,
	avatarUrl,
	isEditing,
	onEdit,
	onCancel,
	onSave,
	onImageUpload,
	onDicebearSelect,
	saving,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [renderButtons, setRenderButtons] = useState(isEditing);
	const [exiting, setExiting] = useState(false);
	const [showDicebearModal, setShowDicebearModal] = useState(false);

	useEffect(() => {
		if (isEditing) {
			setRenderButtons(true);
			setExiting(false);
		} else if (renderButtons) {
			setExiting(true);
			const timeout = setTimeout(() => setRenderButtons(false), 280 + 70 * 3);
			return () => clearTimeout(timeout);
		}
	}, [isEditing, renderButtons]);

	const handleCancel = () => {
		onCancel();
	};

	const handleDicebearSelect = (url: string) => {
		onDicebearSelect(url);
		setShowDicebearModal(false);
	};

	return (
		<>
			<div className="relative group">
				<div className="relative inline-block">
					<div className="rounded-full overflow-hidden ring-4 ring-zinc-100 dark:ring-zinc-800/50">
						<FireAvatar seed={displayName} src={avatarUrl} size={200} background="#fafafa" />
					</div>

					{isEditing && (
						<button
							onClick={() => fileInputRef.current?.click()}
							className="absolute inset-0 flex items-center justify-center bg-black/30 dark:bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
							title="Upload image"
						>
							<HiOutlinePhotograph className="w-8 h-8 text-white" />
						</button>
					)}

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={onImageUpload}
						className="hidden"
					/>
				</div>

				<div className="absolute -bottom-2 -right-2">
					{renderButtons ? (
						<div
							className={`fc-btn-group ${exiting ? 'fc-slide-out-right' : 'fc-slide-in-left'}`}
						>
							<button
								onClick={handleCancel}
								className="fc-btn fc-btn--outline"
								title="Cancel edits"
								aria-label="Cancel edits"
								data-i={0}
							>
								<HiOutlineX />
							</button>

							<button
								onClick={onSave}
								disabled={saving}
								className="fc-btn fc-btn--primary"
								title="Save profile"
								aria-label="Save profile"
								data-i={1}
							>
								<HiOutlineSave />
							</button>

							<button
								type="button"
								className="fc-btn fc-btn--secondary"
								title="Choose AI Avatar"
								aria-label="Choose AI Avatar"
								data-i={2}
								onClick={() => setShowDicebearModal(true)}
							>
								<RiRobot2Line className="w-5 h-5" />
							</button>

							<label title="Upload avatar" className="m-0">
								<button
									type="button"
									className="fc-btn"
									title="Upload avatar"
									aria-label="Upload avatar"
									data-i={3}
									onClick={() => fileInputRef.current?.click()}
								>
									<BiImageAdd />
								</button>
							</label>
						</div>
					) : (
						<div className="fc-btn-group">
							<button
								onClick={onEdit}
								className="fc-btn fc-btn--muted fc-slide-in-left"
								title="Edit profile"
								aria-label="Edit profile"
								data-i={0}
							>
								<HiOutlinePencil />
							</button>
						</div>
					)}
				</div>
			</div>

			{showDicebearModal && (
				<DiceAvatarPicker
					displayName={displayName}
					onSelect={handleDicebearSelect}
					onClose={() => setShowDicebearModal(false)}
				/>
			)}
		</>
	);
};
