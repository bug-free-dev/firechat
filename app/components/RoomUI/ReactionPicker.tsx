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

	// compute simple absolute position (classic + cute)
	const style: React.CSSProperties = {
		visibility: 'hidden',
		position: 'absolute',
		zIndex: 100000,
		bottom: '1.5rem',
		left: 5,
		width: DEFAULT_WIDTH,
		maxWidth: DEFAULT_WIDTH,
		background: 'white',
		borderRadius: 12,
		padding: 5,
		display: 'flex',
		gap: 4,
		flexWrap: 'wrap',
		justifyContent: 'center',
		alignItems: 'center',
		border: '1px solid rgba(0,0,0,0.08)',
		boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
	};

	if (anchorRect) {
		const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		const width = Math.min(maxWidth, vw - 16);
		const centerX = anchorRect.left + anchorRect.width / 2;
		let left = Math.round(centerX - width / 2);
		left = Math.max(8, Math.min(left, vw - width - 8));

		style.left = left;
		style.width = width;
		style.maxWidth = width-15;
		style.visibility = 'visible';
	}

	return (
		// kept a dedicated classname for simple animation: fc-slide-in-left
		<div
			ref={nodeRef}
			style={style}
			role="dialog"
			aria-label="Reaction picker"
			className="fc-slide-in-left"
		>
			{REACTION_EMOJIS.map((emoji) => (
				<button
					key={emoji}
					type="button"
					onPointerDown={(e) => {
						// pointerdown for snappy mobile feel
						e.stopPropagation();
						e.preventDefault();
						onSelect(emoji);
						onClose();
					}}
					className="rounded-md p-1.5 text-md leading-none select-none"
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
