import os from 'os';
import path from 'path';
import {hashData} from '..';
import crypto from 'crypto';
import fs from 'fs/promises';
import {logger} from 'passwordkeeper.logger';
import type {GeneratedRSAKeys, RSA4096Methods} from 'passwordkeeper.types';

export const KEY_FORMAT = 'pem';
export const PUBLIC_KEY_TYPE = 'spki';
export const PRIVATE_KEY_TYPE = 'pkcs8';
export const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
/* istanbul ignore next */
export const PUBLIC_KEY_PERMISSIONS = os.platform() !== 'win32' ? 0o644 : parseInt('644', 8);
/* istanbul ignore next */
export const PRIVATE_KEY_PERMISSIONS = os.platform() !== 'win32' ? 0o600 : parseInt('600', 8);

export const getPathToPublicKey = () => path.resolve(getPathToKeyFolder(), 'pwd-keeper_public.pem');
export const getPathToPrivateKey = () =>
  path.resolve(getPathToKeyFolder(), 'pwd-keeper_private.pem');

export const getPathToKeyFolder = () => {
  const keyFolder: string | undefined = process.env.KEYS_PATH;
  /* istanbul ignore next */
  const pathToKeyFolder: string = path.resolve(process.cwd(), keyFolder ?? './keys');
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
    const privateKeyFile: string = path.join(privateKeyPath, `${keyName}_private.${KEY_FORMAT}`);
    const publicKeyFile: string = path.join(publicKeyPath, `${keyName}_public.${KEY_FORMAT}`);

    // if the folders exist, then return the existing keys
    /* istanbul ignore next */
    if (
      /* istanbul ignore next */
      await fs
        .stat(privateKeyFile)
        /* istanbul ignore next */
        .then(() => true)
        /* istanbul ignore next */
        .catch(() => false)
    ) {
      const publicKey: string = await fs.readFile(publicKeyFile, {encoding: 'utf8'});
      const privateKey: string = await fs.readFile(privateKeyFile, {encoding: 'utf8'});

      logger.warn(`RSA keys already exist for ${keyName}`);
      return {
        pathToPrivateKey: privateKeyFile,
        pathToPublicKey: publicKeyFile,
        publicKey,
        privateKey
      };
    }
    /* istanbul ignore next */
    await fs.mkdir(privateKeyPath, {recursive: true});
    /* istanbul ignore next */
    await fs.mkdir(publicKeyPath, {recursive: true});

    /* istanbul ignore next */
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
    /* istanbul ignore next */
    await fs.writeFile(privateKeyFile, privateKey, {
      encoding: 'utf8',
      mode: PRIVATE_KEY_PERMISSIONS
    });
    /* istanbul ignore next */
    await fs.writeFile(publicKeyFile, publicKey, {encoding: 'utf8', mode: PUBLIC_KEY_PERMISSIONS});

    /* istanbul ignore next */
    logger.warn(`RSA keys generated for ${keyName}`);

    /* istanbul ignore next */
    return {
      pathToPrivateKey: privateKeyFile,
      pathToPublicKey: publicKeyFile,
      publicKey,
      privateKey
    };
  } catch (error) {
    /* istanbul ignore next */
    logger.error('Error generating RSA keys:', error);
    /* istanbul ignore next */
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
    /* istanbul ignore next */
    logger.error('Error reading public key:', error);
    /* istanbul ignore next */
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
    const encryptedPrivateKeyPem: string = await fs.readFile(privateKeyPath, 'utf8');
    const encryptedPrivateKeyBuffer: Buffer = Buffer.from(encryptedPrivateKeyPem);

    return crypto.createPrivateKey({
      key: encryptedPrivateKeyBuffer,
      format: KEY_FORMAT,
      type: PRIVATE_KEY_TYPE,
      passphrase: password
    });
  } catch (error) {
    /* istanbul ignore next */
    logger.error('Error decrypting private key:', error);
    /* istanbul ignore next */
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
    const buffer: Buffer = Buffer.from(data, 'utf8');
    const encrypted: Buffer = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  } catch (error) {
    /* istanbul ignore next */
    logger.error('Error encrypting data with public key:', error);
    /* istanbul ignore next */
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

    const buffer: Buffer = Buffer.from(encryptedData, 'base64');
    const decrypted: Buffer = crypto.privateDecrypt(privateKey, buffer);
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
    const signature: Buffer = crypto.sign(null, Buffer.from(data), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    });
    return signature.toString('base64');
  } catch (error) {
    /* istanbul ignore next */
    logger.error('Error signing data with private key:', error);
    /* istanbul ignore next */
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
    const isVerified: boolean = crypto.verify(
      null,
      Buffer.from(data),
      {key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING},
      Buffer.from(signature, 'base64')
    );
    return isVerified;
  } catch (error) {
    /* istanbul ignore next */
    logger.error('Error verifying data with public key:', error);
    /* istanbul ignore next */
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
    const encryptedData: Buffer = crypto.privateEncrypt(privateKey, Buffer.from(data));
    return encryptedData.toString('base64');
  } catch (error) {
    /* istanbul ignore next */
    logger.error('Error encrypting data with private key:', error);
    /* istanbul ignore next */
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
    const decryptedData: Buffer = crypto.publicDecrypt(
      publicKey,
      Buffer.from(encryptedData, 'base64')
    );
    return decryptedData.toString();
  } catch (error) {
    /* istanbul ignore next */
    logger.error('Error decrypting data with public key:', error);
    /* istanbul ignore next */
    return undefined;
  }
};

/**
 * Verifies the signature for the given session and user.
 * @param userId The user ID.
 * @param nonce The nonce associated with the session.
 * @param signature The signature to verify.
 * @param userPublicKey The user's public key.
 * @returns `true` if the signature is valid, `false` otherwise.
 */
export const verifySignature = async (
  userId: string,
  nonce: string,
  signature: string,
  userPublicKey: string
): Promise<boolean> => {
  // Compute the hash of the user ID and nonce
  const signatureHash = (await hashData(userId + nonce)) as string;

  const msgHeader = `verifySignature:: Error verifying signature for user ${userId} - `;
  /* istanbul ignore next */
  if (!signatureHash) {
    /* istanbul ignore next */
    logger.error(`${msgHeader} error hashing data`);
    /* istanbul ignore next */
    return false;
  }

  // Decrypt the signature using the user's public key
  const decryptedSignature = await decryptWithPublicKey(userPublicKey, signature);

  /* istanbul ignore next */
  if (!decryptedSignature) {
    /* istanbul ignore next */
    logger.error(`${msgHeader} error decrypting signature`);
    /* istanbul ignore next */
    return false;
  }
  /* istanbul ignore next */
  // Compare the hash with the decrypted signature
  if (signatureHash !== decryptedSignature) {
    /* istanbul ignore next */
    logger.error(`${msgHeader} signature does not match hash`);
    /* istanbul ignore next */
    return false;
  }

  return true;
};

export const RSA4096: RSA4096Methods = {
  getPublicKey,
  getPrivateKey,
  generateRSAKeys,
  verifySignature,
  signWithPrivateKey,
  verifyWithPublicKey,
  encryptWithPublicKey,
  decryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey,
  getPathToPublicKey,
  getPathToPrivateKey,
  getPathToKeyFolder,
  KEY_FORMAT,
  PUBLIC_KEY_TYPE,
  PRIVATE_KEY_TYPE,
  ENCRYPTION_ALGORITHM
};
