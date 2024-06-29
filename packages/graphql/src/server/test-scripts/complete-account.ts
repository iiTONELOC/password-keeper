// istanbul ignore file
import {
  getPublicKey,
  generateRSAKeys,
  getPathToKeyFolder,
  getPathToPublicKey,
  decryptWithPublicKey,
  encryptWithPublicKey
} from 'passwordkeeper.crypto';
import {logger} from 'passwordkeeper.logger';
import {GeneratedRSAKeys} from 'passwordkeeper.types';

const decryptTokenAndReEncrypt = async (token: string): Promise<void> => {
  const publicKeyPath = getPathToPublicKey();
  const publicKey = await getPublicKey(publicKeyPath);

  if (!publicKey) {
    throw new Error('Error getting public key');
  }

  const decryptedToken = await decryptWithPublicKey(publicKey, token);

  if (!decryptedToken) {
    throw new Error('Error decrypting token');
  }

  const reEncryptedToken = await encryptWithPublicKey(publicKey, decryptedToken);

  if (!reEncryptedToken) {
    throw new Error('Error re-encrypting token');
  }

  console.log('\n\nRe-encrypted token:');
  console.log(reEncryptedToken);
};

export const generateRSAKeysForUser = async (
  username: string,
  increment: number | undefined = undefined
): Promise<void> => {
  const keyPath = getPathToKeyFolder().replace('.private', `.${username}`);

  logger.warn(`Generating keys for ${username} at ${keyPath}`);

  const userKeys: GeneratedRSAKeys | undefined = await generateRSAKeys(
    increment ? `${username}_${increment}` : username,
    {
      privateKeyPath: keyPath,
      publicKeyPath: keyPath
    },
    username
  );

  if (userKeys) {
    console.log(`\n\nKeys for ${username} created at ${keyPath}`);
    console.log(`\n\nPublic key for ${username}:`);

    // preserve newlines in the public key so we can copy and paste if form the command line as a single string
    // into apollo playground
    const key = userKeys.publicKey.replace(/\n/g, '\\n');
    // remove the very last \n
    console.log(key.slice(0, key.length - 2));
  } else {
    console.error('Error generating keys');
  }
};

if (require.main === module) {
  if (process.env.NODE_ENV === 'production') {
    console.error('This script should not be run in production');
    process.exit(1);
  }

  if (process.argv.length < 4) {
    console.error('Please provide a token and a username');
    process.exit(1);
  }

  const token = process.argv[2];
  const username = process.argv[3];

  (async () => {
    await Promise.all([decryptTokenAndReEncrypt(token), generateRSAKeysForUser(username)]);
  })();
}
