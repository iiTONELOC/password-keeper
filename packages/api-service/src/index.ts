import logger from './logger';
import {createAppServer} from './server';
import {AppServer} from 'packages/types/src';

const appServer: AppServer = createAppServer();

// Look for a port number from command line arguments
const port = process.argv[2] ? parseInt(process.argv[2]) : undefined;

try {
  appServer.start(port);
} catch (error) {
  logger.error(`Error starting server: ${error}`);
}
