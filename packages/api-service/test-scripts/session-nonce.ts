// istanbul ignore file
import path from 'path';
import {PrivateKey} from 'passwordkeeper.types';
import {
  hashData,
  getPublicKey,
  getPrivateKey,
  getPathToPublicKey,
  getPathToKeyFolder,
  encryptWithPrivateKey,
  encryptWithPublicKey,
  decryptWithPrivateKey
} from '../src/utils';

const encryptNonceWithAppsPublicKey = async (nonce: string): Promise<string> => {
  const publicKeyPath = getPathToPublicKey();
  const publicKey = await getPublicKey(publicKeyPath);

  if (!publicKey) {
    throw new Error('Error getting public key');
  }

  const encryptedNonce = await encryptWithPublicKey(publicKey, nonce);

  if (!encryptedNonce) {
    throw new Error('Error encrypting Nonce');
  }

  return encryptedNonce;
};

export const decryptNonceWithUsersPrivateKey = async (
  nonce: string,
  username: string
): Promise<string> => {
  const pathToKeys = getPathToKeyFolder().replace('.private', `.${username}`);

  const usersPrivateKey: PrivateKey = (await getPrivateKey(
    path.join(pathToKeys, `${username}_private.pem`),
    username
  )) as PrivateKey;

  if (!usersPrivateKey) {
    throw new Error('Error getting private key');
  }

  const decryptedNonce = await decryptWithPrivateKey(usersPrivateKey, nonce);

  if (!decryptedNonce) {
    throw new Error('Error decrypting Nonce');
  }

  return decryptedNonce;
};

const createSignature = async (
  userId: string,
  username: string,
  decryptedNonce: string
): Promise<string> => {
  const signatureHash: string = (await hashData(userId + decryptedNonce)) as string;

  const pathToKeys = getPathToKeyFolder().replace('.private', `.${username}`);

  const usersPrivateKey: PrivateKey = (await getPrivateKey(
    path.join(pathToKeys, `${username}_private.pem`),
    username
  )) as PrivateKey;

  if (!usersPrivateKey) {
    throw new Error('Error getting private key');
  }

  const userSignature = await encryptWithPrivateKey(usersPrivateKey, signatureHash);

  if (!userSignature) {
    throw new Error('Error generating signature');
  }

  return userSignature;
};

if (require.main === module) {
  // ensure we are not in process.env.NODE_ENV === 'production'
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot run this script in production');
  }

  const nonce = process.argv[2];
  const username = process.argv[3];
  const userId = process.argv[4];
  const sessionId = process.argv[5];
  // not typically used, but can be used to override the key name - useful for testing
  const overrideKeyName = process.argv[6] || username;

  if (!nonce) {
    throw new Error('Nonce is required');
  }

  if (!username) {
    throw new Error('Username is required');
  }

  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  (async () => {
    // need the Nonce to create a signature
    const decryptedNonce = await decryptNonceWithUsersPrivateKey(nonce, overrideKeyName);
    // need the session ID for sever communication
    const decryptedID = await decryptNonceWithUsersPrivateKey(sessionId, overrideKeyName);
    // re-encrypt the session ID with the app's public key for server communication
    const reEncryptedID = await encryptNonceWithAppsPublicKey(decryptedID);
    // create a signature of the user ID and the decrypted Nonce to authenticate the user
    const signature = await createSignature(userId, overrideKeyName, decryptedNonce);

    console.log(`\nEncrypted Session ID: ${reEncryptedID}`);
    console.log(`\nSignature: ${signature}`);
  })();
}
