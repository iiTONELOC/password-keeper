import http from 'http';
import {resolvers, typeDefs} from '../graphql';
import {AuthContext} from 'passwordkeeper.types';
import {ApolloServer, ApolloServerPlugin} from '@apollo/server';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import {ApolloServerPluginLandingPageLocalDefault} from '@apollo/server/plugin/landingPage/default';

const plugins = (httpServer: http.Server): ApolloServerPlugin<AuthContext>[] => {
  /* istanbul ignore next */
  return process.env.NODE_ENV !== 'production'
    ? [
        ApolloServerPluginDrainHttpServer({httpServer}),
        ApolloServerPluginLandingPageLocalDefault({})
      ]
    : [ApolloServerPluginDrainHttpServer({httpServer})];
};

export const createApolloServer = (httpServer: http.Server) =>
  new ApolloServer({
    typeDefs,
    resolvers,
    plugins: plugins(httpServer),
    introspection: process.env.NODE_ENV !== 'production'
  });
