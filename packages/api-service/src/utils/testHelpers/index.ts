/* istanbul ignore file */
import {publicKeyRegex} from '../../db/Models';

export * from './createTestUser';
export * from './requestLogin';
export * from './loginTestUser';
export * from './getSessionReadyForAuthMiddleware';

/**
 * Normalize a public key by removing extra white spaces and line breaks
 * @param pem - Public key in PEM format
 * @returns the normalized public key or an empty string if the key is invalid
 */
export function normalizeKey(pem: string): string {
  const match = publicKeyRegex.exec(pem);
  if (match?.[1]) {
    // Normalize line breaks and remove extra white spaces
    const normalizedKey = match[1].replace(/\s+/g, '');
    return normalizedKey.trim();
  }
  return '';
}

/**
 * Compare two public keys for equality
 * @param key1 - Public key in PEM format
 * @param key2 - Public key in PEM format
 * @returns true if the keys are equal, false otherwise
 */
export function areKeysEqual(key1: string, key2: string): boolean {
  const normalizedKey1 = normalizeKey(key1);
  const normalizedKey2 = normalizeKey(key2);

  if (normalizedKey1 && normalizedKey2) {
    return normalizedKey1 === normalizedKey2;
  }
  return false;
}
