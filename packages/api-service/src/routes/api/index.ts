import {Router} from 'express';
import apiVersion1Routes from './v1';

const apiRoutes = Router();

apiRoutes.use('/v1', apiVersion1Routes);

export default apiRoutes;
