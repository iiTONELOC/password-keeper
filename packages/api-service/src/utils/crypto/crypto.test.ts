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

  it('should return undefined when generating random bytes with an invalid length', () => {
    const length = -1;
    const randomBytes = generateRandomBytes(length);
    expect(randomBytes).toBeUndefined();
  });

  it('should create a nonce', () => {
    const nonce = createNonce();
    expect(nonce).toBeDefined();
    expect(nonce).not.toBeNull();
    expect(nonce).not.toBe('');
    expect(nonce?.length).toBe(64);
  });

  it('should create a nonce with a specified length', () => {
    const length = 35;
    const nonce = createNonce(length);
    expect(nonce).toBeDefined();
    expect(nonce).not.toBeNull();
    expect(nonce).not.toBe('');
    expect(nonce?.length).toBe(70);
  });

  it('should return a default nonce of 32 bytes when creating a nonce with a length less than 32', () => {
    const length = 16;
    const nonce = createNonce(length);
    expect(nonce).toBeDefined();
    expect(nonce).not.toBeNull();
    expect(nonce).not.toBe('');
    expect(nonce?.length).toBe(64);
  });
});
