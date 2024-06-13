import path from 'path';
import {describe, expect, it} from '@jest/globals';
import {
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
  PRIVATE_KEY_TYPE
} from './index';
import {PrivateKey} from 'passwordkeeper.types';

const TEST_KEY_FOLDER = './keys/test-keys';
const TEST_PRIVATE_KEY_PASSPHRASE = 'test-passphrase';

const publicKeyPath = path.join(TEST_KEY_FOLDER, `rsa-4096-test/`);

describe('RSA-4096 Key Generation', () => {
  it('should generate a public and private key pair', async () => {
    const pathToKeys = await generateRSAKeys(
      'keygen-test',
      {
        publicKeyPath,
        privateKeyPath: publicKeyPath
      },
      TEST_PRIVATE_KEY_PASSPHRASE
    );

    expect(pathToKeys).toBeDefined();
    expect(pathToKeys?.pathToPublicKey).toBeDefined();
    expect(pathToKeys?.pathToPrivateKey).toBeDefined();
    expect(pathToKeys?.pathToPublicKey.includes(pathToKeys.pathToPublicKey)).toBeTruthy();
    expect(pathToKeys?.pathToPrivateKey.includes(pathToKeys.pathToPrivateKey)).toBeTruthy();
  });

  it('should get the public key', async () => {
    const publicKey = (await getPublicKey(
      `${publicKeyPath}keygen-test_public.${KEY_FORMAT}`
    )) as string;

    expect(publicKey).toBeDefined();
    expect(publicKey).not.toBeNull();
    expect(publicKey.includes('-----BEGIN PUBLIC KEY-----')).toBeTruthy();
    expect(publicKey.includes('-----END PUBLIC KEY-----')).toBeTruthy();
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

  it('should not return a decrypted private key if the passphrase is incorrect', async () => {
    expect(
      await getPrivateKey(`${publicKeyPath}keygen-test_private.${KEY_FORMAT}`, 'wrong-passphrase')
    ).toBeUndefined();

    expect.assertions(1);
  });

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
});
