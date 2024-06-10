import logger from '../logger';
import {RSA4096, getPathToKeyFolder} from './crypto';

export * from './crypto';

/**
 * Checks if RSA keys exist for the server and generates them if they do not
 */
export const ensureRsaKeysExist = async () => {
  const pathToKeyFolder = getPathToKeyFolder();

  const privateKeyPassphrase = process.env.PRIVATE_KEY_PASSPHRASE;

  let keys = await RSA4096.generateRSAKeys(
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
