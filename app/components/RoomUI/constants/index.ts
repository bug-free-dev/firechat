import type { CSSProperties } from 'react';

export const LONG_PRESS_DURATION = 500;
export const ACTION_AUTO_HIDE_MS = 3000;
export const MAX_MESSAGE_LENGTH = 500;

export const LOAD_MORE_TRIGGER_PX = 200;
export const SCROLL_DEBOUNCE_MS = 150;
export const AUTO_SCROLL_THRESHOLD = 60;
export const GROUP_TIME_MS = 120_000;

export const DEFAULT_WIDTH = 220;

export const STYLE: CSSProperties = {
	gap: 4,
	left: 5,
	width: DEFAULT_WIDTH,
	display: 'flex',
	border: '1px solid rgba(0,0,0,0.08)',
	bottom: '1.5rem',
	zIndex: 100000,
	padding: 5,
	position: 'absolute',
	maxWidth: DEFAULT_WIDTH,
	background: 'white',
	visibility: 'hidden',
	borderRadius: 15,
	flexWrap: 'wrap',
	justifyContent: 'center',
	alignItems: 'center',
	boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
};

export const MAX_LENGTH = 500;
export const HIGHLIGHT_LINK_ID = 'highlight-theme';

export const THEMES = [
	{ id: 'atom-one-dark', name: 'Atom One Dark' },
	{ id: 'dracula', name: 'Dracula' },
	{ id: 'nord', name: 'Nord' },
	{ id: 'night-owl', name: 'Night Owl' },
	{ id: 'monokai', name: 'Monokai' },
	{ id: 'monokai-sublime', name: 'Monokai Sublime' },
	{ id: 'tokyo-night-dark', name: 'Tokyo Night Dark' },
	{ id: 'vs2015', name: 'VS 2015' },
	{ id: 'androidstudio', name: 'Android Studio' },

	{ id: 'atom-one-light', name: 'Atom One Light' },
	{ id: 'github', name: 'GitHub' },
	{ id: 'github-light', name: 'GitHub Light' },
	{ id: 'google-code', name: 'Google Code' },
	{ id: 'xcode', name: 'Xcode' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
