import express from 'express';
import multer from 'multer';

import CustomerSessionController from './app/controllers/CustomerSessionController';
import CustomerController from './app/controllers/CustomerController';
import AvatarController from './app/controllers/AvatarController';
import PetController from './app/controllers/PetController';
import AppointmentController from './app/controllers/AppointmentController';
import AvailableController from './app/controllers/AvailableController';
import DescountController from './app/controllers/DescountController';
import PurchaseController from './app/controllers/PurchaseController';

import auth from './app/middlewares/auth';
import multerConfig from './config/multer';

const routes = express.Router();
const upload = multer(multerConfig);

routes.post('/session', CustomerSessionController.create);

routes.post('/customer', upload.single('avatar'), CustomerController.create);

routes.post('/purchase', PurchaseController.create);

routes.use(auth);

routes.get('/customer/me', CustomerController.show);
routes.put('/customer', CustomerController.update);
routes.patch(
  '/customer/avatar',
  upload.single('avatar'),
  AvatarController.update
);

routes.post('/customer/pet', upload.single('avatar'), PetController.create);
routes.get('/customer/pet', PetController.index);
routes.put('/customer/pet/:id', PetController.update);
routes.delete('/customer/pet/:id', PetController.delete);

routes.get('/customer/appointment', AppointmentController.index);
routes.get('/appointment/available', AvailableController.show);
routes.post('/customer/appointment', AppointmentController.create);

routes.get('/descount', DescountController.show);

export default routes;
