import logger from '../logger';
import {createHash, randomBytes} from 'crypto';

export * from './rsa-4096';

/**
 * Generate a SHA-256 hash of the provided data
 * @param data - UTF-8 encoded string to hash
 * @returns a SHA-256 hash of the provided data in hexadecimal format or undefined if an error occurs
 */
export const hashData = async (data: string): Promise<string | undefined> => {
  try {
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  } catch (error) {
    logger.error('Error hashing data:', error);
    return undefined;
  }
};

/**
 * Generate a string of random bytes
 * @param length - number of bytes to generate
 * @returns a string of random bytes in hexadecimal format or undefined if an error occurs
 */
export const generateRandomBytes = (length: number): string | undefined => {
  try {
    return randomBytes(length).toString('hex');
  } catch (error) {
    logger.error('Error generating random bytes:', error);
    return undefined;
  }
};

/**
 * Generate a nonce
 * @returns a string of random bytes in hexadecimal format or undefined if an error occurs
 */
export const createNonce = (length = 32): string | undefined =>
  generateRandomBytes(length < 32 ? 32 : length);
