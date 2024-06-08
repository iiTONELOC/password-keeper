import {Router} from 'express';

const publicKeyRoutes = Router();

publicKeyRoutes.get('/', (req, res) => {
  res.send('public key');
});

export default publicKeyRoutes;
