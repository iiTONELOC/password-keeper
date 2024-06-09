import ip from '../ip';
import cors from 'cors';
import logger from '../logger';
import routes from '../routes';
import {Mongoose} from 'mongoose';
import bodyParser from 'body-parser';
import express, {Express} from 'express';
import {ApolloServer} from '@apollo/server';
import createApolloServer from './apolloServer';
import {expressMiddleware} from '@apollo/server/express4';
import connectToDatabase, {disconnectFromDB} from '../db/connection';

import type {AppServer} from '../../../types/src';

const app: Express = express();

export const createAppServer = (port = 3000): AppServer => {
  let database: Mongoose | null = null;
  let server: AppServer['server'] = null;
  const apolloServer: ApolloServer = createApolloServer();

  const connectedMessages: string[] = [
    `🚀 Server started on port ${port}`,
    `Server available locally at http://localhost:${port}`,
    `Server available on LAN at http://${ip}:${port}`
  ];

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

  return {
    app,
    server,
    // prettier-ignore
    async start(portOverride?: number) { /*NOSONAR */
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
      app.use('/graphql', cors(), bodyParser.json(), expressMiddleware(apolloServer));

      // routes
      app.use(routes);

      // connect to database
      database = await connectToDatabase(
        process.env.NODE_ENV === 'production' ? process.env.DB_URI : process.env.DB_NAME
      );

      server = app.listen(port, () => {
        connectedMessages.forEach(msg => logger.info(msg));
      });

      return void 0;
    },

    async stop(): Promise<void> {
      logger.info('🛑 Stopping server');
      server?.close();
      await apolloServer.stop();
      database && (await disconnectFromDB(database));
    }
  };
};
