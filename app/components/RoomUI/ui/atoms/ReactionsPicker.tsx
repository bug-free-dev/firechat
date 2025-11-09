'use client';

import type { CSSProperties } from 'react';
import React, { useEffect, useRef } from 'react';

import { DEFAULT_WIDTH, STYLE as baseStyle } from '@/app/components/RoomUI/constants';
import { REACTION_EMOJIS } from '@/app/lib/types';

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
	maxWidth = DEFAULT_WIDTH,
}) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) onClose();
		};
		document.addEventListener('pointerdown', handlePointerDown);
		return () => document.removeEventListener('pointerdown', handlePointerDown);
	}, [onClose]);

	let positionedStyle: CSSProperties = { ...baseStyle };

	if (anchorRect) {
		const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		const width = Math.min(maxWidth, vw - 16);
		const centerX = anchorRect.left + anchorRect.width / 2;
		let left = Math.round(centerX - width / 2);
		left = Math.max(8, Math.min(left, vw - width - 8));

		positionedStyle = {
			...baseStyle,
			left,
			width,
			maxWidth: width - 15,
			visibility: 'visible',
		};
	}

	return (
		<div
			ref={nodeRef}
			style={positionedStyle}
			role="dialog"
			aria-label="Reaction picker"
			className="fc-slide-in-left"
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
					className="rounded-md p-1.5 text-md leading-none select-none"
					aria-label={`React ${emoji}`}
					style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
				>
					{emoji}
				</button>
			))}
		</div>
	);
};

export default ReactionsPicker;
