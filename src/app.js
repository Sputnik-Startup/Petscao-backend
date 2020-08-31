import 'dotenv/config.js';

import express from 'express';
import routes from './routes.js';

import './database/index.js';

class Application {
  constructor() {
    this.express = express();
    this.middlewares();
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(routes);
  }
}

export default new Application().express;
