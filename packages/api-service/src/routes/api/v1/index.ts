import {Router} from 'express';
import publicKeyRoutes from './public-key';

const apiVersion1Routes = Router();

apiVersion1Routes.get('/', (_, res) => {
  res.send('Version 1');
});

apiVersion1Routes.use('/public-key', publicKeyRoutes);

apiVersion1Routes.use('/graphql', (_, res) => {
  res.send('GraphQL');
});

export default apiVersion1Routes;
