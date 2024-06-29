/*istanbul ignore file */
import {
  getPublicKey,
  getPrivateKey,
  generateRSAKeys,
  getPathToKeyFolder,
  getPathToPrivateKey,
  getPathToPublicKey
} from 'passwordkeeper.crypto';
import {logger} from 'passwordkeeper.logger';
/**
 * Checks if RSA keys exist for the server and generates them if they do not
 */
export const ensureRsaKeysExist = async () => {
  const pathToKeyFolder = getPathToKeyFolder();

  const privateKeyPassphrase = process.env.PRIVATE_KEY_PASSPHRASE;

  logger.warn('Generating RSA keys for the server...');
  const keys = await generateRSAKeys(
    'pwd-keeper',
    {
      privateKeyPath: pathToKeyFolder,
      publicKeyPath: pathToKeyFolder
    },
    privateKeyPassphrase
  );

  if (!keys) {
    logger.error('Error generating RSA keys');
    process.kill(process.pid, 'SIGINT');
  }
};

/**
 * Gets the app's private key
 * @returns the app's private key
 */
export const getAppsPrivateKey = async () => {
  const privateKeyPassphrase = process.env.PRIVATE_KEY_PASSPHRASE;

  return getPrivateKey(getPathToPrivateKey(), privateKeyPassphrase);
};

/**
 * Gets the app's public key
 * @returns the app's public key
 */
export const getAppsPublicKey = async () => {
  return getPublicKey(getPathToPublicKey());
};
