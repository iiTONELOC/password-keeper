import type http from 'http';
import {AuthContext} from 'passwordkeeper.types';
import {ApolloServer, ApolloServerPlugin} from '@apollo/server';
import type {IExecutableSchemaDefinition} from '@graphql-tools/schema';
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

export const createApolloServer = (
  httpServer: http.Server,
  resolvers: IExecutableSchemaDefinition<AuthContext>['resolvers'],
  typeDefs: string
) =>
  new ApolloServer({
    typeDefs,
    resolvers,
    plugins: plugins(httpServer),
    introspection: process.env.NODE_ENV !== 'production'
  });
