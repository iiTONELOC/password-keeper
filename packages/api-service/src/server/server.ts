import ip from '../ip';
import logger from '../logger';
import routes from '../routes';
import express, {Express} from 'express';
import type {AppServer, CreateAppServer} from 'packages/types/src';

const app: Express = express();

// disable headers
app.disable('etag');
app.disable('x-powered-by');

// use middleware
app.use(express.json());

// routes
app.use(routes);

export const createAppServer: CreateAppServer = (port = 3000): AppServer => {
  let server: AppServer['server'] = null;
  return {
    app,
    server,
    start: (portOverride: number | undefined) => {
      try {
        port = portOverride ?? port;
        logger.info('🏁 Starting server');
        server = app.listen(port, () => {
          logger.info(`🚀 Server started on port ${port}`);
          logger.info(`Server available locally at http://localhost:${port}`);
          logger.info(`Server available on LAN at http://${ip}:${port}`);
        });
      } catch (error) {
        logger.error(`Error starting server: ${error}`);
        process.exit(1);
      }
    },
    stop: () => {
      server?.close(() => 'Server stopped');
    }
  };
};

process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
