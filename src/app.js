import 'dotenv/config';

import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { Server } from 'http';
import SocketIO from 'socket.io';
import redis from 'redis';

import routes from './routes';
import './database/index';
import Customer from './app/models/Customer';

class Application {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_HOST,
    });
    this.express = express();
    this.server = new Server(this.express);
    this.io = SocketIO(this.server, {
      cors: {
        origin: '*',
      },
    });
    this.ioConnection();
    this.middlewares();
  }

  middlewares() {
    this.express.use((request, _, next) => {
      request.io = this.io;
      request.redis = this.redisClient;

      return next();
    });
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

  ioConnection() {
    this.io.on('connection', async (socket) => {
      const { token } = socket.handshake.query;

      try {
        const decoded = await promisify(jwt.verify)(
          token,
          `${process.env.SECRET}`
        );

        const isCustomer = await Customer.findByPk(decoded.id);
        if (isCustomer) {
          socket.join('customers');
        } else {
          socket.join('employees');
        }

        this.redisClient.set(decoded.id, socket.id);
      } catch (err) {
        console.log(err);
      }
    });
  }
}

export default new Application().server;
