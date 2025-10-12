import type { ProfileDraft, ValidationResult } from '@/app/components/SlidesUI/utils/constant';
import { MESSAGES, VALIDATION_RULES } from '@/app/components/SlidesUI/utils/constant';
import { checkIdentifierKeyUnique, checkUsernameUnique } from '@/app/lib/utils/checky';

/**
 * Validates username format and availability
 */
export async function validateUsername(
	nickname: string,
	setChecking: (val: boolean) => void
): Promise<ValidationResult> {
	const trimmed = nickname.trim();

	if (!trimmed) {
		return { ok: false, message: MESSAGES.ERROR.USERNAME_EMPTY };
	}

	if (!VALIDATION_RULES.USERNAME.REGEX.test(trimmed)) {
		return { ok: false, message: MESSAGES.ERROR.USERNAME_FORMAT };
	}

	setChecking(true);
	try {
		const isUnique = await checkUsernameUnique(trimmed);
		if (!isUnique) {
			return { ok: false, message: MESSAGES.ERROR.USERNAME_TAKEN };
		}
		return { ok: true, message: MESSAGES.SUCCESS.USERNAME };
	} catch {
		return { ok: false, message: MESSAGES.ERROR.USERNAME_CHECK_FAILED };
	} finally {
		setChecking(false);
	}
}

/**
 * Validates secret identifier format and availability
 */
export async function validateSecret(
	secret: string,
	setChecking: (val: boolean) => void
): Promise<ValidationResult> {
	const trimmed = secret.trim();

	if (!trimmed) {
		return { ok: false, message: MESSAGES.ERROR.SECRET_EMPTY };
	}

	if (!VALIDATION_RULES.SECRET.REGEX.test(trimmed)) {
		return { ok: false, message: MESSAGES.ERROR.SECRET_FORMAT };
	}

	setChecking(true);
	try {
		const isUnique = await checkIdentifierKeyUnique(trimmed);
		if (!isUnique) {
			return { ok: false, message: MESSAGES.ERROR.SECRET_TAKEN };
		}
		return { ok: true, message: MESSAGES.SUCCESS.SECRET };
	} catch {
		return { ok: false, message: MESSAGES.ERROR.SECRET_CHECK_FAILED };
	} finally {
		setChecking(false);
	}
}

/**
 * Validates mood selection
 */
export function validateMood(mood: string | null): ValidationResult {
	if (!mood) {
		return { ok: false, message: MESSAGES.ERROR.MOOD_EMPTY };
	}
	return { ok: true, message: MESSAGES.SUCCESS.MOOD };
}

/**
 * Validates quirks array
 */
export function validateQuirks(quirks: string[]): ValidationResult {
	const count = quirks.length;
	if (count < VALIDATION_RULES.QUIRKS.MIN || count > VALIDATION_RULES.QUIRKS.MAX) {
		return { ok: false, message: MESSAGES.ERROR.QUIRKS_INVALID };
	}
	return { ok: true, message: MESSAGES.SUCCESS.QUIRKS };
}

/**
 * Validates tags array
 */
export function validateTags(tags: string[]): ValidationResult {
	const count = tags.length;
	if (count < VALIDATION_RULES.TAGS.MIN || count > VALIDATION_RULES.TAGS.MAX) {
		return { ok: false, message: MESSAGES.ERROR.TAGS_INVALID };
	}
	return { ok: true, message: MESSAGES.SUCCESS.TAGS };
}

/**
 * Validates profile data
 */
export function validateProfile(profile: ProfileDraft): ValidationResult {
	const hasStatus = profile.status?.trim();
	const hasAbout = profile.about?.trim();

	if (!hasStatus && !hasAbout) {
		return { ok: false, message: MESSAGES.ERROR.PROFILE_EMPTY };
	}
	return { ok: true, message: MESSAGES.SUCCESS.PROFILE };
}
