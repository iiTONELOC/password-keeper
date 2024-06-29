// istanbul ignore file
import path from 'path';
import {
  hashData,
  getPublicKey,
  getPrivateKey,
  getPathToPublicKey,
  getPathToKeyFolder,
  encryptWithPublicKey,
  encryptWithPrivateKey,
  decryptWithPrivateKey
} from 'passwordkeeper.crypto';
import {PrivateKey} from 'passwordkeeper.types';

const decryptNonceWithUsersPrivateKey = async (
  encryptedNonce: string,
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

  const decryptedNonce = await decryptWithPrivateKey(usersPrivateKey, encryptedNonce);

  if (!decryptedNonce) {
    throw new Error('Error decrypting nonce');
  }

  return decryptedNonce;
};

const encryptNonceWithAppsPublicKey = async (nonce: string): Promise<string> => {
  const publicKeyPath = getPathToPublicKey();
  const publicKey = await getPublicKey(publicKeyPath);

  if (!publicKey) {
    throw new Error('Error getting public key');
  }

  const encryptedNonce = await encryptWithPublicKey(publicKey, nonce);

  if (!encryptedNonce) {
    throw new Error('Error encrypting nonce');
  }

  return encryptedNonce;
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
  const [nonce, userId, username] = process.argv.slice(2);

  if (!nonce || !userId || !username) {
    throw new Error('Nonce, userId, and username are required');
  }

  (async () => {
    const decryptedNonce = await decryptNonceWithUsersPrivateKey(nonce, username);

    const encryptedNonce = await encryptNonceWithAppsPublicKey(decryptedNonce);
    const signature = await createSignature(userId, username, decryptedNonce);

    console.log(`\n\nNonce: ${encryptedNonce}`);
    console.log(`\n\nSignature: ${signature}`);
  })().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
