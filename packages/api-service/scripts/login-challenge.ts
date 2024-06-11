import {encryptWithPublicKey, getPathToPublicKey, getPublicKey} from '../src/utils';

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

if (require.main === module) {
  const challenge = process.argv[2];

  if (!challenge) {
    throw new Error('Challenge is required');
  }

  encryptChallengeWithAppsPublicKey(challenge)
    .then(encryptedChallenge => {
      console.log('\nEncrypted challenge:');
      console.log(encryptedChallenge);
    })
    .catch(error => {
      console.error(error);
    });
}
