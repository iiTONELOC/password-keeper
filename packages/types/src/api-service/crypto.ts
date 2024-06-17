/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {KeyObject} from 'crypto';

export type GeneratedRSAKeys = {
  pathToPrivateKey: string;
  pathToPublicKey: string;
  publicKey: string;
  privateKey: string;
};
export type PrivateKey = KeyObject;

export type RSA4096Methods = {
  getPublicKey: (publicKeyPath: string) => Promise<string | undefined>;
  getPrivateKey: (privateKeyPath: string, password?: string) => Promise<PrivateKey | undefined>;
  generateRSAKeys: (
    keyName: string,
    pathToFolders: {
      privateKeyPath: string;
      publicKeyPath: string;
    },
    password?: string
  ) => Promise<GeneratedRSAKeys | undefined>;
  encryptWithPublicKey: (publicKey: string, data: string) => Promise<string | undefined>;
  decryptWithPrivateKey: (privateKey: PrivateKey, data: string) => Promise<string | undefined>;
  decryptWithPublicKey: (publicKey: string, data: string) => Promise<string | undefined>;
  encryptWithPrivateKey: (privateKey: PrivateKey, data: string) => Promise<string | undefined>;
  verifyWithPublicKey: (publicKey: string, data: string, signature: string) => Promise<boolean>;
  signWithPrivateKey: (privateKey: PrivateKey, data: string) => Promise<string | undefined>;
  verifySignature: (
    userId: string,
    nonce: string,
    signature: string,
    userPublicKey: string
  ) => Promise<boolean>;
  KEY_FORMAT: 'pem';
  PRIVATE_KEY_TYPE: 'pkcs8';
  PUBLIC_KEY_TYPE: 'spki';
  ENCRYPTION_ALGORITHM: 'aes-256-cbc';
  getPathToPublicKey: () => string;
  getPathToPrivateKey: () => string;
  getPathToKeyFolder: () => string;
};

export type AES_EncryptionData = {
  iv: string;
  encryptedData: string;
};

export type AES_256_Methods = {
  generateAESEncryptionKey: (password: string) => Promise<Buffer>;
  encryptAES: (
    data: string,
    password: string,
    encryptionKey?: Buffer
  ) => Promise<AES_EncryptionData>;
  decryptAES: (
    encryptionData: AES_EncryptionData,
    password: string,
    encryptionKey?: Buffer
  ) => Promise<string>;
};
