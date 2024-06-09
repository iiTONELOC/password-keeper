import {Server} from 'http';
import {Express} from 'express';

/**
 * AppPort is the port number for the app server.
 * If the port is not provided, it will default to 3000.
 */
export type AppPort = number | undefined;

/**
 * Creates an app server.
 * It takes an optional port number and returns an AppServer.
 */
export type CreateAppServer = (port?: AppPort) => AppServer;

/**
 * Contains the express app, server, and methods for starting and stopping the http server.
 */
export type AppServer = {
  app: Express;
  server: Server | null;
  start: (port: AppPort) => void;
  stop: () => string | void;
};
