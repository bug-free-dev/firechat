export type Step = `namey` | `sneaky` | `moody` | `quirky` | `taggy` | `picky` | `launchy`;

export type ProfileDraft = {
	avatarUrl?: string | null;
	status?: string;
	about?: string;
};

export type OnboardingData = {
	nickname: string;
	displayName: string;
	secret: string;
	mood: string | null;
	quirks: string[];
	tags: string[];
	profile: ProfileDraft;
};

export type ValidationResult = {
	ok: boolean;
	message?: string;
};

/* <------- CONSTANTS -------> */

export const STEPS: ReadonlyArray<{ id: Step; title: string }> = [
	{ id: `namey`, title: `Namey` },
	{ id: `sneaky`, title: `Sneaky` },
	{ id: `moody`, title: `Moody` },
	{ id: `quirky`, title: `Quirky` },
	{ id: `taggy`, title: `Taggy` },
	{ id: `picky`, title: `Picky` },
	{ id: `launchy`, title: `Launchy` },
] as const;

export const VALIDATION_RULES = {
	USERNAME: {
		REGEX: /^[a-zA-Z0-9_-]{3,15}$/,
		MIN_LENGTH: 3,
		MAX_LENGTH: 15,
	},
	SECRET: {
		REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/,
		MIN_LENGTH: 5,
	},
	QUIRKS: {
		MIN: 1,
		MAX: 5,
	},
	TAGS: {
		MIN: 1,
		MAX: 10,
	},
} as const;

export const MESSAGES = {
	SUCCESS: {
		USERNAME: `Nice pick! That name has flair.`,
		SECRET: `Sneaky choice! No one will guess that.`,
		MOOD: `Feeling that mood today? Nice!`,
		QUIRKS: `Those quirks are gold — love the style!`,
		TAGS: `Tags loaded! You're officially extra.`,
		PROFILE: `Looking good! People will know you're here.`,
		LAUNCH: `Welcome aboard — redirecting to your desk!`,
	},
	ERROR: {
		USERNAME_EMPTY: `You gotta pick a username, superstar!`,
		USERNAME_FORMAT: `Keep it simple: 3-15 letters, numbers, _ or - only.`,
		USERNAME_TAKEN: `Oops, someone else beat you to that name!`,
		USERNAME_CHECK_FAILED: `Hmm… could't check that username right now.`,
		SECRET_EMPTY: `Every hero needs a secret key!`,
		SECRET_FORMAT: `Make it strong: 6+ chars with uppercase, lowercase, and a number.`,
		SECRET_TAKEN: `That secret is already taken… choose a sneaky one!`,
		SECRET_CHECK_FAILED: `Couldn't verify the secret… try again in a sec.`,
		MOOD_EMPTY: `Pick a mood — let the world know your vibe!`,
		QUIRKS_INVALID: `Add 1-5 quirks to show your fun side.`,
		TAGS_INVALID: `Add 1-10 tags so people know what you're into.`,
		PROFILE_EMPTY: `Share a bit about yourself or a status line.`,
		SIGNED_OUT: `You appear signed out — please sign in again.`,
		LAUNCH_FAILED: `Could't finish onboarding — try again.`,
		LAUNCH_UNEXPECTED: `Unexpected error`,
	},
} as const;
