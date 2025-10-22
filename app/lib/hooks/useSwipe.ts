import React, { useRef, useState } from 'react';

const SWIPE_THRESHOLD = 40;
const MAX_SWIPE = 50;

export const useSwipeReply = (onReply: () => void) => {
	const [swipeOffset, setSwipeOffset] = useState(0);
	const touchStart = useRef<{ x: number; y: number } | null>(null);
	const isDragging = useRef(false);
	const hasReplied = useRef(false);
	const longPressTimer = useRef<number | null>(null);

	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		if (!touch) return;

		touchStart.current = { x: touch.clientX, y: touch.clientY };
		isDragging.current = false;
		hasReplied.current = false;

		if (longPressTimer.current) clearTimeout(longPressTimer.current);
		// Optional: long-press logic can go here
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!touchStart.current) return;
		const touch = e.touches[0];
		if (!touch) return;

		const deltaX = touch.clientX - touchStart.current.x;
		const deltaY = touch.clientY - touchStart.current.y;

		if (Math.abs(deltaY) > 10) {
			if (longPressTimer.current) {
				clearTimeout(longPressTimer.current);
				longPressTimer.current = null;
			}
			return;
		}

		if (Math.abs(deltaX) > 5) {
			isDragging.current = true;
			if (longPressTimer.current) {
				clearTimeout(longPressTimer.current);
				longPressTimer.current = null;
			}
		}

		if (deltaX > 0) {
			const progress = Math.min(deltaX / MAX_SWIPE, 1);
			const eased = deltaX * (1 - progress * 0.5);
			setSwipeOffset(Math.min(eased, MAX_SWIPE));
		}
	};

	const handleTouchEnd = () => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}

		if (swipeOffset > SWIPE_THRESHOLD && !hasReplied.current) {
			hasReplied.current = true;
			onReply();
		}

		setSwipeOffset(0);
		isDragging.current = false;
		touchStart.current = null;
	};

	return { swipeOffset, handleTouchStart, handleTouchMove, handleTouchEnd };
};
