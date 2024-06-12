import path from 'path';
import {KeyObject} from 'crypto';
import {
  hashData,
  getPublicKey,
  getPrivateKey,
  getPathToPublicKey,
  getPathToKeyFolder,
  encryptWithPrivateKey,
  encryptWithPublicKey
} from '../src/utils';

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

const createLoginSignature = async (username: string, challenge: string): Promise<string> => {
  const signatureHash: string = (await hashData(username + challenge)) as string;

  const pathToKeys = getPathToKeyFolder().replace('.private', `.${username}`);

  console.log('\n\nGET PATH TO KEY FOLDER: ', pathToKeys, '\n\n');

  const usersPrivateKey: KeyObject = (await getPrivateKey(
    path.join(pathToKeys, `${username}_private.pem`),
    username
  )) as KeyObject;

  console.log('\n\nGET PRIVATE KEY: ', usersPrivateKey, '\n\n');

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

  if (!challenge) {
    throw new Error('Challenge is required');
  }

  if (!username) {
    throw new Error('Username is required');
  }

  (async () => {
    const [encryptedChallenge, signature] = await Promise.all([
      encryptChallengeWithAppsPublicKey(challenge),
      createLoginSignature(username, challenge)
    ]);

    console.log('Login challenge and signature:');
    console.log({encryptedChallenge, signature});
  })();
}
