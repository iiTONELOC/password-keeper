/*istanbul ignore file */
import {logger} from 'passwordkeeper.logger';
import {Router, Request, Response} from 'express';
import {getPathToPublicKey} from 'passwordkeeper.crypto';
import {ensureRsaKeysExist} from 'passwordkeeper.graphql';

const publicKeyRoutes = Router();

publicKeyRoutes.get('/', async (req: Request, res: Response) => {
  const publicKeyPath: string = getPathToPublicKey();

  if (!publicKeyPath) {
    logger.error('Public key not found >> GENERATING NEW KEYS');
    res.status(500).send('Public key not found');
    await ensureRsaKeysExist();
  } else {
    Promise.resolve().then(() => {
      const {method, baseUrl, ip} = req;
      logger.http(
        `Received ${method} request to ${baseUrl} from ${ip} >> RESPONDING WITH PUBLIC KEY`
      );

      res.sendFile(publicKeyPath);
    });
  }
});

export default publicKeyRoutes;
