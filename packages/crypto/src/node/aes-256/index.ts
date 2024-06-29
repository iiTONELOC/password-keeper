/* eslint-disable @typescript-eslint/no-unused-vars */
import crypto from 'crypto';
import {logger} from 'passwordkeeper.logger';
import {AES_256_Methods, AES_EncryptionData} from 'passwordkeeper.types';

/* istanbul ignore next */
const getSalt = (): string => process.env.AES_SALT ?? 'salt';
/* istanbul ignore next */
const getPepper = (): string => process.env.AES_PEPPER ?? 'pepper';

/**
 * Creates a key for symmetric encryption using the user provided password, a pepper, and a salt
 *
 * @param password the user provided password for encryption
 * @returns The encryption key as a buffer, this value is not stored anywhere
 * @rejects {Error} - rejects with an error if the encryption fails
 */
export const generateAESEncryptionKey = async (password: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const salt: string = getSalt();
      /* istanbul ignore next */
      const pep = getPepper()?.trim();
      /* istanbul ignore next */
      const pepper: Buffer = Buffer.from(pep ?? '', 'utf8');

      /* istanbul ignore next */
      if (!pepper.length) {
        throw new Error('No pepper found');
      }
      if (!password.length) {
        throw new Error('No password found');
      }
      const key: Buffer = crypto.pbkdf2Sync(password + pepper, salt, 100000, 32, 'sha256');
      resolve(key);
    } catch (error) {
      logger.error('Error generating encryption key:', error);
      reject(new Error('Error generating encryption key'));
    }
  });
};

/**
 * Encrypts the data using the provided password and encryption key
 *
 * @param data any serialized data
 * @param password the password to use for the encryption key
 * @param encryptionKey an optional encryption key, if not provided, one will be generated
 * @returns {Promise<AES_EncryptionData>} - returns the encrypted data and the initialization vector
 * @rejects {Error} - rejects with an error if the encryption fails
 */
export const encryptAES = async (
  data: string,
  password: string,
  encryptionKey?: Buffer
): Promise<AES_EncryptionData> => {
  return new Promise((resolve, reject) => {
    const encryptData = (encryptionKey: Buffer) => {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-ctr', encryptionKey, iv);
      const encryptedData = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
      resolve({iv: iv.toString('hex'), encryptedData});
    };

    if (encryptionKey) {
      try {
        encryptData(encryptionKey);
      } catch (error) {
        // istanbul ignore next
        reject(new Error('Error encrypting data'));
      }
    } else {
      generateAESEncryptionKey(password)
        .then((key: Buffer) => {
          encryptData(key);
        })
        .catch(error => {
          // istanbul ignore next
          reject(new Error('Error generating encryption key'));
        });
    }
  });
};

/**
 * Decrypts the data using the provided password and encryption key
 *
 * @param encryptionData the encrypted data and initialization vector
 * @param password the password to use for the encryption key
 * @param encryptionKey an optional encryption key, if not provided, one will be generated
 * @returns {Promise<string>} - returns the decrypted data
 * @rejects {Error} - rejects with an error if the decryption fails
 */
export const decryptAES = async (
  encryptionData: AES_EncryptionData,
  password: string,
  encryptionKey?: Buffer
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const decryptData = (encryptionKey: Buffer) => {
      const decipher = crypto.createDecipheriv(
        'aes-256-ctr',
        encryptionKey,
        Buffer.from(encryptionData.iv, 'hex')
      );
      const decryptedData =
        decipher.update(encryptionData.encryptedData, 'hex', 'utf8') + decipher.final('utf8');
      resolve(decryptedData);
    };

    if (encryptionKey) {
      try {
        decryptData(encryptionKey);
      } catch (error) {
        // istanbul ignore next
        reject(new Error('Error decrypting data'));
      }
    } else {
      generateAESEncryptionKey(password)
        .then((key: Buffer) => {
          decryptData(key);
        })
        .catch(_ => {
          // istanbul ignore next
          reject(new Error('Error generating encryption key'));
        });
    }
  });
};

export const AES_256: AES_256_Methods = {
  generateAESEncryptionKey,
  encryptAES,
  decryptAES
};

export default AES_256;
