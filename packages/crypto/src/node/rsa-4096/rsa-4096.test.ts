import path from 'path';
import fs from 'fs/promises';
import {describe, expect, it} from '@jest/globals';
import {GeneratedRSAKeys, PrivateKey} from 'passwordkeeper.types';
import {
  KEY_FORMAT,
  getPublicKey,
  getPrivateKey,
  generateRSAKeys,
  PRIVATE_KEY_TYPE,
  signWithPrivateKey,
  verifyWithPublicKey,
  encryptWithPublicKey,
  decryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey
} from './index';

const TEST_KEY_FOLDER = './keys/test-keys';
const TEST_PRIVATE_KEY_PASSPHRASE = 'test-passphrase';

const publicKeyPath = path.join(TEST_KEY_FOLDER, `rsa-4096-test/`);

describe('RSA-4096 Key Generation', () => {
  it("should generate a public and private key pair if they don't exist", async () => {
    const generatedKeys: GeneratedRSAKeys | undefined = await generateRSAKeys(
      'keygen-test',
      {
        publicKeyPath,
        privateKeyPath: publicKeyPath
      },
      TEST_PRIVATE_KEY_PASSPHRASE
    );

    expect(generatedKeys).toBeDefined();
    expect(generatedKeys?.pathToPublicKey).toBeDefined();
    expect(generatedKeys?.pathToPrivateKey).toBeDefined();
    expect(generatedKeys?.pathToPublicKey.includes(generatedKeys?.pathToPublicKey)).toBeTruthy();
    expect(generatedKeys?.pathToPrivateKey.includes(generatedKeys?.pathToPrivateKey)).toBeTruthy();
  });

  it('should return existing keys rather than generating new ones', async () => {
    // get the private and public keys
    const existingPublicKey: string | undefined = await fs.readFile(
      path.join(publicKeyPath, 'keygen-test_public.pem'),
      'utf8'
    );
    const existingPrivateKey: string | undefined = await fs.readFile(
      path.join(publicKeyPath, 'keygen-test_private.pem'),
      'utf8'
    );

    // try to generate new keys
    const generatedKeys: GeneratedRSAKeys | undefined = await generateRSAKeys(
      'keygen-test',
      {
        publicKeyPath,
        privateKeyPath: publicKeyPath
      },
      TEST_PRIVATE_KEY_PASSPHRASE
    );

    expect(generatedKeys).toBeDefined();
    expect(generatedKeys?.pathToPublicKey).toBeDefined();
    expect(generatedKeys?.pathToPrivateKey).toBeDefined();
    expect(generatedKeys?.pathToPublicKey.includes(generatedKeys?.pathToPublicKey)).toBeTruthy();
    expect(generatedKeys?.pathToPrivateKey.includes(generatedKeys?.pathToPrivateKey)).toBeTruthy();
    expect(existingPublicKey).toEqual(generatedKeys?.publicKey);
    expect(existingPrivateKey).toEqual(generatedKeys?.privateKey);
  });
});

describe('getPublicKey and getPrivateKey', () => {
  it('should get the public key', async () => {
    const publicKey = (await getPublicKey(
      `${publicKeyPath}keygen-test_public.${KEY_FORMAT}`
    )) as string;

    expect(publicKey).toBeDefined();
    expect(publicKey).not.toBeNull();
    expect(publicKey.includes('-----BEGIN PUBLIC KEY-----')).toBeTruthy();
    expect(publicKey.includes('-----END PUBLIC KEY-----')).toBeTruthy();
  });

  it('should not return undefined if the public key does not exist', async () => {
    expect(await getPublicKey(`${publicKeyPath}non-existent-key.${KEY_FORMAT}`)).toBeUndefined();

    expect.assertions(1);
  });

  it('should get the private key', async () => {
    const privateKey = (
      await getPrivateKey(
        `${publicKeyPath}keygen-test_private.${KEY_FORMAT}`,
        TEST_PRIVATE_KEY_PASSPHRASE
      )
    )?.export({
      type: PRIVATE_KEY_TYPE,
      format: KEY_FORMAT
    }) as string;
    expect(privateKey).toBeDefined();
    expect(privateKey).not.toBeNull();
    expect(privateKey.includes('-----BEGIN PRIVATE KEY-----')).toBeTruthy();
    expect(privateKey.includes('-----END PRIVATE KEY-----')).toBeTruthy();
  });

  it('should not return undefined if the private key does not exist', async () => {
    expect(
      await getPrivateKey(
        `${publicKeyPath}non-existent-key.${KEY_FORMAT}`,
        TEST_PRIVATE_KEY_PASSPHRASE
      )
    ).toBeUndefined();

    expect.assertions(1);
  });

  it('should not return a decrypted private key if the passphrase is incorrect', async () => {
    expect(
      await getPrivateKey(`${publicKeyPath}keygen-test_private.${KEY_FORMAT}`, 'wrong-passphrase')
    ).toBeUndefined();

    expect.assertions(1);
  });
});

describe('RSA-4096 Public Key Encryption and Private Key Decryption', () => {
  it('should encrypt and decrypt with public and private keys', async () => {
    const message = 'This is a test message';
    const publicKey = (await getPublicKey(
      `${publicKeyPath}keygen-test_public.${KEY_FORMAT}`
    )) as string;

    const privateKey = (await getPrivateKey(
      `${publicKeyPath}keygen-test_private.${KEY_FORMAT}`,
      TEST_PRIVATE_KEY_PASSPHRASE
    )) as PrivateKey;

    const encrypted = await encryptWithPublicKey(publicKey, message);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBeNull();

    const decrypted = await decryptWithPrivateKey(privateKey, encrypted ?? '');

    expect(decrypted).toBeDefined();
    expect(decrypted).not.toBeNull();
    expect(decrypted).toEqual(message);

    expect.assertions(5);
  });

  it('should not encrypt if the public key is invalid', async () => {
    const message = 'This is a test message';
    const publicKey = {};
    // @ts-expect-error - Testing invalid input
    expect(await encryptWithPublicKey(publicKey, message)).toBeUndefined();
  });

  it('should not decrypt if the private key is invalid', async () => {
    const message = 'This is a test message';
    const privateKey = {};
    // @ts-expect-error - Testing invalid input
    expect(await decryptWithPrivateKey(privateKey, message)).toBeUndefined();
  });

  it('should throw an error if there is no encrypted data to decrypt', async () => {
    const privateKey = (await getPrivateKey(
      `${publicKeyPath}keygen-test_private.${KEY_FORMAT}`,
      TEST_PRIVATE_KEY_PASSPHRASE
    )) as PrivateKey;

    // @ts-expect-error - Testing invalid input
    expect(await decryptWithPrivateKey(privateKey, undefined)).toBeUndefined();
  });
});

describe('RSA-4096 Private Key Encryption and Public Key Decryption', () => {
  it('should encrypt and decrypt with private and public keys', async () => {
    const message = 'This is a test message';
    const publicKey = (await getPublicKey(
      `${publicKeyPath}keygen-test_public.${KEY_FORMAT}`
    )) as string;

    const privateKey = (await getPrivateKey(
      `${publicKeyPath}keygen-test_private.${KEY_FORMAT}`,
      TEST_PRIVATE_KEY_PASSPHRASE
    )) as PrivateKey;

    const encrypted = await encryptWithPrivateKey(privateKey, message);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBeNull();

    const decrypted = await decryptWithPublicKey(publicKey, encrypted ?? '');

    expect(decrypted).toBeDefined();
    expect(decrypted).not.toBeNull();
    expect(decrypted).toEqual(message);

    expect.assertions(5);
  });
});

describe('RSA-4096 Message Signing and Verification', () => {
  it('should sign and verify with private and public keys', async () => {
    const message = 'This is a test message';
    const publicKey = (await getPublicKey(
      `${publicKeyPath}keygen-test_public.${KEY_FORMAT}`
    )) as string;

    const privateKey = (await getPrivateKey(
      `${publicKeyPath}keygen-test_private.${KEY_FORMAT}`,
      TEST_PRIVATE_KEY_PASSPHRASE
    )) as PrivateKey;

    const signature = await signWithPrivateKey(privateKey, message);

    expect(signature).toBeDefined();
    expect(signature).not.toBeNull();

    const verified = await verifyWithPublicKey(publicKey, message, signature ?? '');

    expect(verified).toBeTruthy();

    expect.assertions(3);
  });

  it('Should be able to verify a signature with a public key', async () => {
    const message = 'This is a test message';
    const publicKey = (await getPublicKey(
      `${publicKeyPath}keygen-test_public.${KEY_FORMAT}`
    )) as string;

    const privateKey = (await getPrivateKey(
      `${publicKeyPath}keygen-test_private.${KEY_FORMAT}`,
      TEST_PRIVATE_KEY_PASSPHRASE
    )) as PrivateKey;

    const signature = await signWithPrivateKey(privateKey, message);

    expect(signature).toBeDefined();
    expect(signature).not.toBeNull();

    const verified = await verifyWithPublicKey(publicKey, message, signature ?? '');

    expect(verified).toBeTruthy();

    expect.assertions(3);
  });

  it('Verify with public key should return false if the signature is invalid', async () => {
    const message = 'This is a test message';
    const publicKey = (await getPublicKey(
      `${publicKeyPath}keygen-test_public.${KEY_FORMAT}`
    )) as string;

    const privateKey = (await getPrivateKey(
      `${publicKeyPath}keygen-test_private.${KEY_FORMAT}`,
      TEST_PRIVATE_KEY_PASSPHRASE
    )) as PrivateKey;

    const signature = await signWithPrivateKey(privateKey, message);

    expect(signature).toBeDefined();
    expect(signature).not.toBeNull();

    const verified = await verifyWithPublicKey(
      publicKey,
      'This is a different message',
      signature ?? ''
    );

    expect(verified).toBeFalsy();

    expect.assertions(3);
  });
});
