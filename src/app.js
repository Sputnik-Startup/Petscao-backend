import 'dotenv/config';

import express from 'express';
import path from 'path';
import routes from './routes';

import './database/index';

class Application {
  constructor() {
    this.express = express();
    this.middlewares();
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(
      '/static',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
    this.express.use(routes);
  }
}

export default new Application().express;
