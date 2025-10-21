'use client';

import React, { useEffect, useRef } from 'react';

import { REACTION_EMOJIS } from '@/app/lib/types';

export interface ReactionPickerProps {
	anchorRect: DOMRect | null;
	onSelect: (emoji: string) => void;
	onClose: () => void;
	maxWidth?: number;
}

const DEFAULT_WIDTH = 220;
const GAP = 8;

const ReactionPicker: React.FC<ReactionPickerProps> = ({
	anchorRect,
	onSelect,
	onClose,
	maxWidth = DEFAULT_WIDTH,
}) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);

	// Close on outside pointerdown
	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener('pointerdown', handlePointerDown);
		return () => document.removeEventListener('pointerdown', handlePointerDown);
	}, [onClose]);

	// compute position
	const style: React.CSSProperties = { visibility: 'hidden', position: 'fixed', zIndex: 9999 };

	if (anchorRect) {
		const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		const width = Math.min(maxWidth, vw - 16);
		const centerX = anchorRect.left + anchorRect.width / 2;
		let left = Math.round(centerX - width / 2);
		left = Math.max(8, Math.min(left, vw - width - 8));

		// attempt to place below; if not enough space, place above
		const estimatedHeight = 56; // one row of emojis ~56px; picker can grow; using small estimate is fine
		const spaceBelow = vh - anchorRect.bottom;
		const spaceAbove = anchorRect.top;
		let top: number;
		if (spaceBelow >= estimatedHeight + GAP) {
			top = Math.round(anchorRect.bottom + GAP);
		} else if (spaceAbove >= estimatedHeight + GAP) {
			top = Math.round(anchorRect.top - estimatedHeight - GAP);
		} else {
			// neither side has enough room: clamp to fit in viewport
			top = Math.max(8, Math.min(anchorRect.bottom + GAP, vh - estimatedHeight - 8));
		}

		style.left = left;
		style.top = top;
		style.width = width;
		style.maxWidth = width;
		style.visibility = 'visible';
		style.background = 'white';
		style.borderRadius = 12;
		style.padding = '8px';
		style.display = 'flex';
		style.gap = '2px';
		style.flexWrap = 'wrap';
		style.justifyContent = 'center';
		style.alignItems = 'center';
	}

	return (
		<div ref={nodeRef} style={style} role="dialog" aria-label="Reaction picker">
			{REACTION_EMOJIS.map((emoji) => (
				<button
					key={emoji}
					type="button"
					onPointerDown={(e) => {
						// use pointerdown so selection feels snappy on mobile
						e.stopPropagation();
						e.preventDefault();
						onSelect(emoji);
						onClose();
					}}
					className="rounded-md p-1.5 text-lg leading-none select-none"
					aria-label={`React ${emoji}`}
					style={{
						background: 'transparent',
						border: 'none',
						cursor: 'pointer',
					}}
				>
					{emoji}
				</button>
			))}
		</div>
	);
};

export default ReactionPicker;
