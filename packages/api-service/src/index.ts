import logger from './logger';
import {createAppServer} from './server';
import {AppServer} from 'packages/types/src';

const appServer: AppServer = createAppServer();

// look for a port number from command line arguments
const port = process.argv[2] ? parseInt(process.argv[2]) : undefined;

const handleExit = () => {
  appServer.stop();
  logger.info('Server stopped');
};

try {
  appServer.start(port);

  process.on('SIGTERM', handleExit);
  process.on('SIGINT', handleExit);
} catch (error) {
  logger.error(`Error starting server: ${error}`);
  handleExit();
}
