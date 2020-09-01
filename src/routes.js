import express from 'express';

import SessionController from './app/controllers/SessionController';
import auth from './app/middlewares/auth';

const routes = express.Router();

routes.use(auth);

routes.post('/session', SessionController.create);

export default routes;
