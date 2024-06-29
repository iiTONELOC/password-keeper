import {createAppServer} from './server';
import {logger} from 'passwordkeeper.logger';
import type {AppServer} from 'passwordkeeper.types';

/**
 * Looks for an optional port argument in the command line arguments
 * If one is not found, it looks for a PORT environment variable,
 * and if that is not found, it defaults to 3000
 * @returns
 */
const port = () => {
  if (process.argv[2] !== undefined) {
    return parseInt(process.argv[2]);
  } else if (process.env.PORT !== undefined) {
    return parseInt(process.env.PORT);
  } else {
    return 3000;
  }
};

(async () => {
  const _port = port();
  // defaults to 3000 if no port is provided
  const appServer: AppServer = createAppServer();
  try {
    // start the server with the overridden port
    await appServer.start(_port);
  } catch (error) {
    logger.error(`Error starting server: ${error}`);
  }
})();
