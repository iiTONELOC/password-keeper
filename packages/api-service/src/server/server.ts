import ip from '../ip';
import cors from 'cors';
import http from 'http';
import logger from '../logger';
import routes from '../routes';
import {Mongoose} from 'mongoose';
import bodyParser from 'body-parser';
import express, {Express} from 'express';
import {withAuthContext} from './withAuth';
import {ensureRsaKeysExist} from '../utils';
import createApolloServer from './apolloServer';
import {expressMiddleware} from '@apollo/server/express4';
import connectToDatabase, {disconnectFromDB} from '../db/connection';

import type {AppServer} from 'passwordkeeper.types';

const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:*']
};

export const createAppServer = (port = 3000): AppServer => {
  const app: Express = express();
  const httpServer: http.Server = http.createServer(app);

  let database: Mongoose | null = null;

  const apolloServer = createApolloServer(httpServer);

  const connectedMessages: string[] = [
    `🚀 Server started on port ${port}`,
    `Server available locally at http://localhost:${port}`,
    `Server available on LAN at http://${ip}:${port}`
  ];

  // Handle nodemon restarts
  process.on('SIGUSR2', () => {
    logger.info('🔄 Restarting server');
    httpServer.close();
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('⛔ Gracefully shutting down server');
    httpServer.close();
    process.exit(0);
  });

  return {
    app,
    server: httpServer,

    async start(portOverride?: number) {
      await ensureRsaKeysExist();
      port = portOverride ?? port;
      logger.info('🏁 Starting server');

      // disable headers
      app.disable('etag');
      app.disable('x-powered-by');

      // use middleware
      app.use(express.json());

      // start apollo server
      await apolloServer.start();

      // attach apollo server to express as middleware on the /graphql route
      app.use(
        '/graphql',
        cors<cors.CorsRequest>(corsOptions),
        bodyParser.json(),
        expressMiddleware(apolloServer, {
          context: async ({req}) => {
            return {
              ...(await withAuthContext(req))
            };
          }
        })
      );

      // routes
      app.use(routes);

      // connect to database
      database = await connectToDatabase(
        process.env.NODE_ENV === 'production' ? process.env.DB_URI : process.env.DB_NAME
      );

      // start the http server
      await new Promise<void>(resolve => {
        httpServer.listen({port}, resolve);

        for (const message of connectedMessages) {
          logger.info(message);
        }
      });
    },

    async stop(): Promise<void> {
      logger.info('🛑 Stopping server');
      httpServer.close();
      await apolloServer.stop();
      database && (await disconnectFromDB(database));
    }
  };
};
