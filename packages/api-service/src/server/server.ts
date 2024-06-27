import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import routes from '../routes';
import {Mongoose} from 'mongoose';
import bodyParser from 'body-parser';
import express, {Express} from 'express';
import {ApolloServer} from '@apollo/server';
import {resolvers, typeDefs} from '../graphql';
import {ensureRsaKeysExist, ip, logger} from '../utils';
import {expressMiddleware} from '@apollo/server/express4';
import {getAuth, limiter, logGraphRequest} from '../middleware';
import {createApolloServer} from 'passwordkeeper.graphql/dist/server';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import type {AppServer, AuthContext, IAuthSessionDocument} from 'passwordkeeper.types';

export const corsOptions: cors.CorsOptions = {
  origin: []
};

export const createAppServer = (port = 3000): AppServer => {
  let database: Mongoose | null = null;

  const app: Express = express();
  const httpServer: http.Server = http.createServer(app);
  const apolloServer: ApolloServer<AuthContext> = createApolloServer(
    httpServer,
    resolvers,
    typeDefs
  );

  const isProduction = process.env.NODE_ENV === 'production';

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

      /* istanbul ignore next */
      if (isProduction) {
        // if we are in production mode, only allow the production origins from the environment
        corsOptions.origin = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
        // trust the first proxy
        app.set('trust proxy', 1);
        // use helmet
        app.use(helmet());
        // use rate limiter
        app.use(limiter);
      } else {
        corsOptions.origin = [`http://localhost:${port}`, `http://${ip}:${port}`];
        connectedMessages.push(
          `GraphQL Playground available at http://localhost:${port}/api/v1/graphql`
        );
      }

      // disable etags
      app.disable('etag');
      // use JSON parser
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
            logGraphRequest(req, session);
            /* istanbul ignore next */
            return {session};
          }
        })
      );

      // attach routes
      app.use(routes);

      // connect to database
      database = await connectToDB(
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
