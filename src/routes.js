import express from 'express';
import multer from 'multer';

import ClientSessionController from './app/controllers/ClientSessionController';
import ClientController from './app/controllers/ClientController';

import auth from './app/middlewares/auth';
import multerConfig from './config/multer';
import AvatarController from './app/controllers/AvatarController';

const routes = express.Router();
const upload = multer(multerConfig);

routes.post('/session', ClientSessionController.create);

routes.post('/client', upload.single('avatar'), ClientController.create);

routes.use(auth);

routes.get('/client/me', ClientController.show);
routes.put('/client', ClientController.update);
routes.patch(
  '/client/avatar',
  upload.single('avatar'),
  AvatarController.update
);

export default routes;
