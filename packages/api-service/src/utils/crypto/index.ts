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
    console.error('Error hashing data:', error);
    return undefined;
  }
};

/**
 * Generate a string of random bytes
 * @param length - number of bytes to generate
 * @returns a string of random bytes in hexadecimal format or undefined if an error occurs
 */
export const generateRandomBytes = async (length: number): Promise<string | undefined> => {
  try {
    return randomBytes(length).toString('hex');
  } catch (error) {
    console.error('Error generating random bytes:', error);
    return undefined;
  }
};

/**
 * Generate a nonce
 * @returns a string of random bytes in hexadecimal format or undefined if an error occurs
 */
export const createNonce = async (length = 32): Promise<string | undefined> =>
  generateRandomBytes(length < 32 ? 32 : length);
