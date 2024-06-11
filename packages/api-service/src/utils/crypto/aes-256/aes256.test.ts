import _crypto from '.';
import {describe, expect, it} from '@jest/globals';

describe('_crypto utilities', () => {
  const testData = 'This is some test data';
  const testPassword = 'password';

  describe('generateAESEncryptionKey', () => {
    it('should be defined', () => {
      expect(_crypto.generateAESEncryptionKey).toBeDefined();
    });

    it('should return a promise', () => {
      expect(_crypto.generateAESEncryptionKey('password')).toBeInstanceOf(Promise);
    });

    it('that promise should resolve to a Buffer', async () => {
      const key = await _crypto.generateAESEncryptionKey('password');
      expect(key).toBeInstanceOf(Buffer);
    });

    it('that Buffer should have a length of 32', async () => {
      const key = await _crypto.generateAESEncryptionKey('password');
      expect(key.length).toBe(32);
    });

    it('that Buffer should be different when called again', async () => {
      const key1 = await _crypto.generateAESEncryptionKey('password');
      const key2 = await _crypto.generateAESEncryptionKey('password');
      expect(key1).not.toBe(key2);
    });

    it('that Buffer should be different when called with different passwords', async () => {
      const key1 = await _crypto.generateAESEncryptionKey('password1');
      const key2 = await _crypto.generateAESEncryptionKey('password2');
      expect(key1).not.toBe(key2);
    });

    it('should throw an error when called with an empty password', async () => {
      await expect(_crypto.generateAESEncryptionKey('')).rejects.toThrow();
    });
  });

  describe('encrypt', () => {
    it('should be defined', () => {
      expect(_crypto.encryptAES).toBeDefined();
    });

    it('should return a promise', () => {
      expect(_crypto.encryptAES(testData, testPassword)).toBeInstanceOf(Promise);
    });

    it('the promise should resolve to an object with iv and encryptedData properties', async () => {
      const {iv, encryptedData} = await _crypto.encryptAES(testData, testPassword);
      expect(iv).toBeDefined();
      expect(encryptedData).toBeDefined();
    });

    it('the iv should be a string', async () => {
      const {iv} = await _crypto.encryptAES(testData, testPassword);
      expect(typeof iv).toBe('string');
    });

    it('the iv should have a length of 32', async () => {
      const {iv} = await _crypto.encryptAES(testData, testPassword);
      expect(iv.length).toBe(32);
    });

    it('the encryptedData should be a string', async () => {
      const {encryptedData} = await _crypto.encryptAES(testData, testPassword);
      expect(typeof encryptedData).toBe('string');
    });

    it('the encryptedData should not be equal to the original data', async () => {
      const {encryptedData} = await _crypto.encryptAES(testData, testPassword);
      expect(encryptedData).not.toBe(testData);
    });

    it('should accept a prebuilt encryption key', async () => {
      const key = await _crypto.generateAESEncryptionKey(testPassword);
      const {iv, encryptedData} = await _crypto.encryptAES(testData, testPassword, key);
      expect(iv).toBeDefined();
      expect(encryptedData).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should be defined', () => {
      expect(_crypto.decryptAES).toBeDefined();
    });

    it('It should return a string that should be equal to the original data', async () => {
      const encrypted = await _crypto.encryptAES(testData, testPassword);
      const encrypted2 = await _crypto.encryptAES(testData, testPassword);

      const decryptedData = await _crypto.decryptAES(encrypted, testPassword);
      expect(decryptedData).toBe(testData);
      expect(decryptedData).not.toBe(encrypted);
      expect(typeof decryptedData).toBe('string');

      const decryptedData2 = await _crypto.decryptAES(encrypted2, testPassword);
      expect(decryptedData2).toBe(testData);
      expect(decryptedData2).not.toBe(encrypted2);
      expect(typeof decryptedData2).toBe('string');
    });

    it('should accept a prebuilt encryption key', async () => {
      const key = await _crypto.generateAESEncryptionKey(testPassword);
      const encrypted = await _crypto.encryptAES(testData, testPassword, key);

      const decryptedData = await _crypto.decryptAES(encrypted, testPassword, key);
      expect(decryptedData).toBe(testData);
      expect(decryptedData).not.toBe(encrypted);
      expect(typeof decryptedData).toBe('string');
    });
  });
});
