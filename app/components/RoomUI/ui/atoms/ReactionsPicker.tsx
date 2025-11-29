'use client';

import React, { useEffect, useRef } from 'react';

import { REACTION_EMOJIS } from '@/app/lib/types';

import { useReactionPickerStyle } from '../../hooks/usePickerStyle';

export interface ReactionPickerProps {
	anchorRect: DOMRect | null;
	onSelect: (emoji: string) => void;
	onClose: () => void;
	maxWidth?: number;
}

const ReactionsPicker: React.FC<ReactionPickerProps> = ({
	anchorRect,
	onSelect,
	onClose,
	maxWidth = 240,
}) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const style = useReactionPickerStyle(anchorRect, maxWidth);

	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) onClose();
		};
		document.addEventListener('pointerdown', handlePointerDown);
		return () => document.removeEventListener('pointerdown', handlePointerDown);
	}, [onClose]);

	return (
		<div
			ref={nodeRef}
			style={style}
			role="dialog"
			aria-label="Reaction picker"
			className="fc-slide-in-left rounded-lg"
		>
			{REACTION_EMOJIS.map((emoji) => (
				<button
					key={emoji}
					type="button"
					onPointerDown={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onSelect(emoji);
						onClose();
					}}
					className="rounded-md p-2 text-lg leading-none select-none hover:scale-110 transition-transform"
					style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
					aria-label={`React ${emoji}`}
				>
					{emoji}
				</button>
			))}
		</div>
	);
};

export default ReactionsPicker;
