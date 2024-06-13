import {describe, expect, it} from '@jest/globals';
import {hashData, generateRandomBytes, createNonce} from './index';

describe('Crypto Utils', () => {
  it('should hash data', async () => {
    const data = 'test-data';
    const hashedData = await hashData(data);
    expect(hashedData).toBeDefined();
    expect(hashedData).not.toBeNull();
    expect(hashedData).not.toBe('');
    expect(hashedData).not.toBe(data);
  });

  it('should generate random bytes', () => {
    const length = 32;
    const randomBytes = generateRandomBytes(length);
    expect(randomBytes).toBeDefined();
    expect(randomBytes).not.toBeNull();
    expect(randomBytes).not.toBe('');
    expect(randomBytes?.length).toBe(length * 2);
  });

  it('should create a nonce', () => {
    const nonce = createNonce();
    expect(nonce).toBeDefined();
    expect(nonce).not.toBeNull();
    expect(nonce).not.toBe('');
    expect(nonce?.length).toBe(64);
  });
});
