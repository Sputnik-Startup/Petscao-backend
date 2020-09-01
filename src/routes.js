import express from 'express';
import multer from 'multer';

import ClientSessionController from './app/controllers/ClientSessionController';
import ClientController from './app/controllers/ClientController';

import auth from './app/middlewares/auth';
import multerConfig from './config/multer';

const routes = express.Router();
const upload = multer(multerConfig);

routes.use(auth);

routes.post('/session', ClientSessionController.create);

routes.post('/client', upload.single('avatar'), ClientController.create);

export default routes;
