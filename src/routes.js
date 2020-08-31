import express from 'express';

const routes = express.Router();

routes.get('/', (request, response) => {
  return response.json({ msg: 'teste' });
});

export default routes;
