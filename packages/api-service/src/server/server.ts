import cors from 'cors';
import http from 'http';
import {ip} from '../utils';
import helmet from 'helmet';
import routes from '../routes';
import {Mongoose} from 'mongoose';
import bodyParser from 'body-parser';
import express, {Express} from 'express';
import {ApolloServer} from '@apollo/server';
import {logger} from 'passwordkeeper.logger';
import {expressMiddleware} from '@apollo/server/express4';
import {limiter, logGraphRequest} from '../middleware';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import type {AppServer, AuthContext, IAuthSessionDocument} from 'passwordkeeper.types';
import {
  getAuth,
  resolvers,
  typeDefs,
  createApolloServer,
  ensureRsaKeysExist
} from 'passwordkeeper.graphql';

// Set up the CORS options for the express server
// The values will be added to the corsOptions object dynamically
export const corsOptions: cors.CorsOptions = {
  origin: []
};

/**
 * Create an instance of the App server
 * @param port  The port to run the server on, defaults to 3000
 * @returns    An instance of the AppServer
 */
export const createAppServer = (port = 3000): AppServer => {
  let database: Mongoose | null = null;

  // create an express app
  const app: Express = express();
  // attach the express app to the http server
  const httpServer: http.Server = http.createServer(app);
  // create an Apollo Server instance => This will be attached as middleware to the express app
  const apolloServer: ApolloServer<AuthContext> = createApolloServer(
    httpServer,
    resolvers,
    typeDefs
  );

  // Determine if the server is in production mode
  const isProduction = process.env.NODE_ENV === 'production';

  // Gracefully shutdown the server
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

  // Return the AppServer instance
  return {
    // attach the express app and http server to the AppServer instance
    app,
    server: httpServer,

    /**
     * Method to start the server
     * @param portOverride The port to run the server on, defaults to the port passed to the createAppServer function
     */
    async start(portOverride?: number): Promise<void> {
      // Ensure the RSA keys exist
      await ensureRsaKeysExist();
      // Determine the port to run the server on
      port = portOverride ?? port;

      logger.info('🏁 Starting server');

      // Messages to display when the server is started
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
