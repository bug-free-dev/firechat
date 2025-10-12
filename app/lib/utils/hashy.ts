import bcrypt from 'bcryptjs';

export async function hashIdentifierKeyAsync(key: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(key, salt);
}

export async function verifyIdentifierKeyAsync(
	inputKey: string,
	storedHash: string
): Promise<boolean> {
	return await bcrypt.compare(inputKey, storedHash);
}
