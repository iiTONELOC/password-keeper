import * as crypto from 'crypto';

export type GeneratedRSAKeys = {
  pathToPrivateKey: string;
  pathToPublicKey: string;
  publicKey: string;
  privateKey: string;
};

export type RSA4096Methods = {
  getPublicKey: (publicKeyPath: string) => Promise<string | undefined>;
  getPrivateKey: (
    privateKeyPath: string,
    password?: string
  ) => Promise<crypto.KeyObject | undefined>;
  generateRSAKeys: (
    keyName: string,
    pathToFolders: {
      privateKeyPath: string;
      publicKeyPath: string;
    },
    password?: string
  ) => Promise<GeneratedRSAKeys | undefined>;
  encryptWithPublicKey: (publicKey: string, data: string) => Promise<string | undefined>;
  decryptWithPrivateKey: (
    privateKey: crypto.KeyObject,
    data: string
  ) => Promise<string | undefined>;
  decryptWithPublicKey: (publicKey: string, data: string) => Promise<string | undefined>;
  encryptWithPrivateKey: (
    privateKey: crypto.KeyObject,
    data: string
  ) => Promise<string | undefined>;
  verifyWithPublicKey: (publicKey: string, data: string, signature: string) => Promise<boolean>;
  signWithPrivateKey: (privateKey: crypto.KeyObject, data: string) => Promise<string | undefined>;
  KEY_FORMAT: 'pem';
  PRIVATE_KEY_TYPE: 'pkcs8';
  PUBLIC_KEY_TYPE: 'spki';
  ENCRYPTION_ALGORITHM: 'aes-256-cbc';
};
