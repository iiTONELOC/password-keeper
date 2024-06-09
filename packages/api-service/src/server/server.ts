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

  const connectedMessages = [
    `🚀 Server started on port ${port}`,
    `Server available locally at http://localhost:${port}`,
    `Server available on LAN at http://${ip}:${port}`
  ];

  return {
    app,
    server,
    start: (portOverride: number | undefined) => {
      try {
        port = portOverride ?? port;
        logger.info('🏁 Starting server');

        server = app.listen(port, () => {
          connectedMessages.forEach(msg => logger.info(msg));
        });

        // Handle nodemon restarts
        process.on('SIGUSR2', () => {
          logger.info('🔄 Restarting server');
          server?.close();
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => {
          logger.info('⛔ Gracefully shutting down server');
          server?.close(() => process.exit(0));
        });
      } catch (error) {
        logger.error(`Error starting server: ${error}`);
        process.exit(1);
      }
    },

    stop: () => {
      logger.info('🛑 Stopping server');
      server?.close();
    }
  };
};
