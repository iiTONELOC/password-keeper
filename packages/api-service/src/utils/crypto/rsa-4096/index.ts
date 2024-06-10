import os from 'os';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import logger from '../../../logger';
import type {GeneratedRSAKeys, RSA4096Methods} from 'passwordkeeper.types';

export const KEY_FORMAT = 'pem';
export const PUBLIC_KEY_TYPE = 'spki';
export const PRIVATE_KEY_TYPE = 'pkcs8';
export const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
export const PUBLIC_KEY_PERMISSIONS = os.platform() !== 'win32' ? 0o644 : parseInt('644', 8);
export const PRIVATE_KEY_PERMISSIONS = os.platform() !== 'win32' ? 0o600 : parseInt('600', 8);
export const getPathToPublicKey = () => path.resolve(getPathToKeyFolder(), 'pwd-keeper_public.pem');
export const getPathToPrivateKey = () =>
  path.resolve(getPathToKeyFolder(), 'pwd-keeper_private.pem');

export const getPathToKeyFolder = () => {
  const keyFolder = process.env.KEYS_PATH;
  const pathToKeyFolder = path.resolve(process.cwd(), keyFolder ?? './keys');

  return pathToKeyFolder;
};

/**
 * Generates RSA keys using the crypto module
 *
 * @param keyName - The name of the key pair, this will be used to name the files
 * @param pathToFolders - The path to the folders where the keys will be stored
 * @param password - An optional password to encrypt the private key (recommended)
 * @returns The path to the public and private keys, and the keys themselves or undefined if an error occurred
 */
export const generateRSAKeys = async (
  keyName: string,
  pathToFolders: {privateKeyPath: string; publicKeyPath: string},
  password?: string
): Promise<GeneratedRSAKeys | undefined> => {
  try {
    const {privateKeyPath, publicKeyPath} = pathToFolders;
    const privateKeyFile = path.join(privateKeyPath, `${keyName}_private.${KEY_FORMAT}`);
    const publicKeyFile = path.join(publicKeyPath, `${keyName}_public.${KEY_FORMAT}`);

    // if the folders exist, then return the existing keys
    if (
      await fs
        .stat(privateKeyFile)
        .then(() => true)
        .catch(() => false)
    ) {
      const publicKey = await fs.readFile(publicKeyFile, {encoding: 'utf8'});
      const privateKey = await fs.readFile(privateKeyFile, {encoding: 'utf8'});
      return {
        pathToPrivateKey: privateKeyFile,
        pathToPublicKey: publicKeyFile,
        publicKey,
        privateKey
      };
    }

    await fs.mkdir(privateKeyPath, {recursive: true});
    await fs.mkdir(publicKeyPath, {recursive: true});

    const {publicKey, privateKey} = await new Promise<{
      publicKey: string;
      privateKey: string;
    }>((resolve, reject) => {
      crypto.generateKeyPair(
        'rsa',
        {
          modulusLength: 4096,
          publicKeyEncoding: {type: PUBLIC_KEY_TYPE, format: KEY_FORMAT},
          privateKeyEncoding: {
            type: PRIVATE_KEY_TYPE,
            format: KEY_FORMAT,
            cipher: password ? ENCRYPTION_ALGORITHM : undefined,
            passphrase: password
          }
        },
        (err, publicKey, privateKey) => {
          if (err) reject(err);
          else resolve({publicKey, privateKey});
        }
      );
    });

    await fs.writeFile(privateKeyFile, privateKey, {
      encoding: 'utf8',
      mode: PRIVATE_KEY_PERMISSIONS
    });
    await fs.writeFile(publicKeyFile, publicKey, {encoding: 'utf8', mode: PUBLIC_KEY_PERMISSIONS});

    return {
      pathToPrivateKey: privateKeyFile,
      pathToPublicKey: publicKeyFile,
      publicKey,
      privateKey
    };
  } catch (error) {
    logger.error('Error generating RSA keys:', error);
    return undefined;
  }
};

/**
 * Reads a public key from a file
 *
 * @param publicKeyPath - The path to the public key file
 * @returns The public key or undefined if an error occurred
 */
export const getPublicKey = async (publicKeyPath: string): Promise<string | undefined> => {
  try {
    return await fs.readFile(publicKeyPath, {encoding: 'utf8'});
  } catch (error) {
    logger.error('Error reading public key:', error);
    return undefined;
  }
};

/**
 * Reads a private key from a file
 *
 * @param privateKeyPath - The path to the private key file
 * @param password - The optional password that was used to encrypt the private key
 * @returns The private key or undefined if an error occurred
 */
export const getPrivateKey = async (
  privateKeyPath: string,
  password?: string
): Promise<crypto.KeyObject | undefined> => {
  try {
    const encryptedPrivateKeyPem = await fs.readFile(privateKeyPath, 'utf8');
    const encryptedPrivateKeyBuffer = Buffer.from(encryptedPrivateKeyPem);

    return crypto.createPrivateKey({
      key: encryptedPrivateKeyBuffer,
      format: KEY_FORMAT,
      type: PRIVATE_KEY_TYPE,
      passphrase: password
    });
  } catch (error) {
    logger.error('Error decrypting private key:', error);
    return undefined;
  }
};

/**
 * Encrypts data using a public key
 *
 * @param publicKey - The public key to encrypt the data with
 * @param data - The data to encrypt
 * @returns The encrypted data or undefined if an error occurred
 */
export const encryptWithPublicKey = async (
  publicKey: string,
  data: string
): Promise<string | undefined> => {
  try {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  } catch (error) {
    logger.error('Error encrypting data with public key:', error);
    return undefined;
  }
};

/**
 * Decrypts data using a private key
 *
 * @param privateKey - The private key to decrypt the data with
 * @param encryptedData - The encrypted data to decrypt
 * @returns The decrypted data or undefined if an error occurred
 */
export const decryptWithPrivateKey = async (
  privateKey: crypto.KeyObject,
  encryptedData: string
): Promise<string | undefined> => {
  try {
    if (!encryptedData) throw new Error('No data to decrypt');

    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption Error:', error);
    return undefined;
  }
};

/**
 * Signs data using a private key
 *
 * @param privateKey - The private key to sign the data with
 * @param data - The data to sign
 * @returns The signature or undefined if an error occurred
 */
export const signWithPrivateKey = async (
  privateKey: crypto.KeyObject,
  data: string
): Promise<string | undefined> => {
  try {
    const signature = crypto.sign(null, Buffer.from(data), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    });
    return signature.toString('base64');
  } catch (error) {
    logger.error('Error signing data with private key:', error);
    return undefined;
  }
};

/**
 * Verifies data using a public key
 *
 * @param publicKey - The public key to verify the data with
 * @param data - The data to verify
 * @param signature - The signature to verify
 * @returns Whether the data was verified or not
 */
export const verifyWithPublicKey = async (
  publicKey: string,
  data: string,
  signature: string
): Promise<boolean> => {
  try {
    const isVerified = crypto.verify(
      null,
      Buffer.from(data),
      {key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING},
      Buffer.from(signature, 'base64')
    );
    return isVerified;
  } catch (error) {
    logger.error('Error verifying data with public key:', error);
    return false;
  }
};

/**
 * Encrypts data using a private key
 *
 * @param privateKey - The private key to encrypt the data with
 * @param data - The data to encrypt
 * @returns The encrypted data or undefined if an error occurred
 */
export const encryptWithPrivateKey = async (
  privateKey: crypto.KeyObject,
  data: string
): Promise<string | undefined> => {
  try {
    const encryptedData = crypto.privateEncrypt(privateKey, Buffer.from(data));
    return encryptedData.toString('base64');
  } catch (error) {
    logger.error('Error encrypting data with private key:', error);
    return undefined;
  }
};

/**
 * Decrypts data using a public key
 *
 * @param publicKey - The public key to decrypt the data with
 * @param encryptedData - The encrypted data to decrypt
 * @returns The decrypted data or undefined if an error occurred
 */
export const decryptWithPublicKey = async (
  publicKey: string,
  encryptedData: string
): Promise<string | undefined> => {
  try {
    const decryptedData = crypto.publicDecrypt(publicKey, Buffer.from(encryptedData, 'base64'));
    return decryptedData.toString();
  } catch (error) {
    logger.error('Error decrypting data with public key:', error);
    return undefined;
  }
};

export const RSA4096: RSA4096Methods = {
  getPublicKey,
  getPrivateKey,
  generateRSAKeys,
  signWithPrivateKey,
  verifyWithPublicKey,
  encryptWithPublicKey,
  decryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey,
  KEY_FORMAT,
  PUBLIC_KEY_TYPE,
  PRIVATE_KEY_TYPE,
  ENCRYPTION_ALGORITHM,
  getPathToPublicKey,
  getPathToPrivateKey,
  getPathToKeyFolder
};
