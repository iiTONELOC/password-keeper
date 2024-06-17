import ip from '../ip';
import cors from 'cors';
import http from 'http';
import logger from '../logger';
import routes from '../routes';
import {Mongoose} from 'mongoose';
import bodyParser from 'body-parser';
import {getAuth} from '../middleware';
import express, {Express} from 'express';

import {ensureRsaKeysExist} from '../utils';
import createApolloServer from './apolloServer';
import type {AppServer, IAuthSessionDocument} from 'passwordkeeper.types';
import {expressMiddleware} from '@apollo/server/express4';
import connectToDatabase, {disconnectFromDB} from '../db/connection';

const corsOptions: cors.CorsOptions = {
  origin: []
};

export const createAppServer = (port = 3000): AppServer => {
  const app: Express = express();
  const httpServer: http.Server = http.createServer(app);
  const apolloServer = createApolloServer(httpServer);

  let database: Mongoose | null = null;

  const gracefulShutdown = () => {
    /* istanbul ignore next */
    logger.info('⛔ Gracefully shutting down server');
    /* istanbul ignore next */
    httpServer.close();
    /* istanbul ignore next */
    process.exit(0);
  };

  // Handle graceful shutdown
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  return {
    app,
    server: httpServer,

    async start(portOverride?: number): Promise<void> {
      await ensureRsaKeysExist();
      port = portOverride ?? port;
      logger.info('🏁 Starting server');

      const connectedMessages: string[] = [
        `🚀 Server started on port ${port}`,
        `Server available locally at http://localhost:${port}`,
        `Server available on LAN at http://${ip}:${port}`
      ];

      // if we are in development mode, allow all origins, and display the graphql playground
      /* istanbul ignore next */
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        corsOptions.origin = [`http://localhost:${port}`, `http://${ip}:${port}`];
        connectedMessages.push(
          `GraphQL Playground available at http://localhost:${port}/api/v1/graphql`
        );
      }

      // if we are in production mode, only allow the production origins from the environment
      /* istanbul ignore next */
      if (process.env.NODE_ENV === 'production') {
        corsOptions.origin = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
      }

      // disable headers
      app.disable('etag');
      app.disable('x-powered-by');
      // use middleware
      app.use(express.json());

      // start apollo server
      await apolloServer.start();

      // attach apollo server to express as middleware on the /graphql route
      app.use(
        '/api/v1/graphql',
        cors<cors.CorsRequest>(corsOptions),
        bodyParser.json(),
        expressMiddleware(apolloServer, {
          /* istanbul ignore */
          context: async ({req}) => {
            /* istanbul ignore next */
            const session: IAuthSessionDocument = (await getAuth(req)) as IAuthSessionDocument;
            /* istanbul ignore next */
            return {session};
          }
        })
      );

      // attach routes
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
