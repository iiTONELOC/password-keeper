import http from 'http';
import {AuthContext} from 'packages/types/src';
import {resolvers, typeDefs} from '../graphql';
import {ApolloServer, ApolloServerPlugin} from '@apollo/server';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';

import {ApolloServerPluginLandingPageLocalDefault} from '@apollo/server/plugin/landingPage/default';

const plugins = (httpServer: http.Server): ApolloServerPlugin<AuthContext>[] => {
  return process.env.NODE_ENV !== 'production'
    ? [
        ApolloServerPluginDrainHttpServer({httpServer}),
        ApolloServerPluginLandingPageLocalDefault({})
      ]
    : [ApolloServerPluginDrainHttpServer({httpServer})];
};

const createApolloServer = (httpServer: http.Server) =>
  new ApolloServer({
    typeDefs,
    resolvers,
    plugins: plugins(httpServer)
  });

export default createApolloServer;
