import logger from './logger';
import {createAppServer} from './server';
import {AppServer} from 'passwordkeeper.types';

const appServer: AppServer = createAppServer();

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
  console.log(`Starting server on port ${_port}`);
  try {
    await appServer.start(_port);
  } catch (error) {
    logger.error(`Error starting server: ${error}`);
  }
})();
