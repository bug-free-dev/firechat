/**
 * Default kudos granted to a user.
 */
export const DEFAULT_KUDOS = 200 as const;

/**
 * Supported reaction emojis.
 */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '👏'] as const;

/**
 * Type of supported reaction emoji.
 */
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
