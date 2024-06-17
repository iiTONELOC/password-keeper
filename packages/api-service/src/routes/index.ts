/*istanbul ignore file */
import apiRoutes from './api';
import {Router, Request, Response} from 'express';

const routes = Router();

routes.get('/', (_: Request, res: Response) => {
  res.send('Hello World');
});

routes.use('/api', apiRoutes);

export default routes;
