import {resolvers, typeDefs} from '../graphql';
import {ApolloServer, ApolloServerPlugin, BaseContext} from '@apollo/server';
import {ApolloServerPluginLandingPageLocalDefault} from '@apollo/server/plugin/landingPage/default';

const plugins: ApolloServerPlugin<BaseContext>[] =
  process.env.NODE_ENV !== 'production' ? [ApolloServerPluginLandingPageLocalDefault({})] : [];

const createApolloServer = () =>
  new ApolloServer({
    typeDefs,
    resolvers,
    plugins
  });

export default createApolloServer;
