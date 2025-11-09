import { useCallback, useRef } from 'react';

export const useLongPress = (onLongPress: () => void, ms = 500) => {
	const timerRef = useRef<number | null>(null);
	const activeRef = useRef(false);

	const start = useCallback(() => {
		if (typeof window === 'undefined') return;
		if (timerRef.current) window.clearTimeout(timerRef.current);
		activeRef.current = true;
		timerRef.current = window.setTimeout(() => {
			if (activeRef.current) onLongPress();
		}, ms) as unknown as number;
	}, [onLongPress, ms]);

	const cancel = useCallback(() => {
		activeRef.current = false;
		if (timerRef.current) {
			window.clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	return { start, cancel };
};
