/*istanbul ignore file */
import logger from './logger';
import {RSA4096, getPathToKeyFolder, getPathToPrivateKey, getPathToPublicKey} from './crypto';

export * from './crypto';

/**
 * Checks if RSA keys exist for the server and generates them if they do not
 */
export const ensureRsaKeysExist = async () => {
  const pathToKeyFolder = getPathToKeyFolder();

  const privateKeyPassphrase = process.env.PRIVATE_KEY_PASSPHRASE;

  logger.warn('Generating RSA keys for the server...');
  const keys = await RSA4096.generateRSAKeys(
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

  return RSA4096.getPrivateKey(getPathToPrivateKey(), privateKeyPassphrase);
};

/**
 * Gets the app's public key
 * @returns the app's public key
 */
export const getAppsPublicKey = async () => {
  return RSA4096.getPublicKey(getPathToPublicKey());
};

export {ip} from './ip';
export {default as logger} from './logger';
