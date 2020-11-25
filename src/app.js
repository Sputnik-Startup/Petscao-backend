import 'dotenv/config';

import express from 'express';
import path from 'path';
import cors from 'cors';
import routes from './routes';

import './database/index';

class Application {
  constructor() {
    this.express = express();
    this.middlewares();
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(cors());
    this.express.use(
      '/public',
      express.static(path.resolve(__dirname, '..', 'public'))
    );
    this.express.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
    this.express.use(routes);
  }
}

export default new Application().express;
