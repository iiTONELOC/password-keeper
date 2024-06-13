import path from 'path';
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
import {PrivateKey} from 'passwordkeeper.types';

const encryptChallengeWithAppsPublicKey = async (challenge: string): Promise<string> => {
  const publicKeyPath = getPathToPublicKey();
  const publicKey = await getPublicKey(publicKeyPath);

  if (!publicKey) {
    throw new Error('Error getting public key');
  }

  const encryptedChallenge = await encryptWithPublicKey(publicKey, challenge);

  if (!encryptedChallenge) {
    throw new Error('Error encrypting challenge');
  }

  return encryptedChallenge;
};

const decryptChallengeWithUsersPrivateKey = async (
  challenge: string,
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

  const decryptedChallenge = await decryptWithPrivateKey(usersPrivateKey, challenge);

  if (!decryptedChallenge) {
    throw new Error('Error decrypting challenge');
  }

  return decryptedChallenge;
};

const createSignature = async (
  userId: string,
  username: string,
  decryptedChallenge: string
): Promise<string> => {
  const signatureHash: string = (await hashData(userId + decryptedChallenge)) as string;

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

  const challenge = process.argv[2];
  const username = process.argv[3];
  const userId = process.argv[4];
  const sessionId = process.argv[5];

  if (!challenge) {
    throw new Error('Challenge is required');
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
    // need the challenge to create a signature
    const decryptedChallenge = await decryptChallengeWithUsersPrivateKey(challenge, username);
    // need the session ID for sever communication
    const decryptedID = await decryptChallengeWithUsersPrivateKey(sessionId, username);
    // re-encrypt the session ID with the app's public key for server communication
    const reEncryptedID = await encryptChallengeWithAppsPublicKey(decryptedID);
    // create a signature of the user ID and the decrypted challenge to authenticate the user
    const signature = await createSignature(userId, username, decryptedChallenge);

    console.log(`\nEncrypted Session ID: ${reEncryptedID}`);
    console.log(`\nSignature: ${signature}`);
  })();
}
