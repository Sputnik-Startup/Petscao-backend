import Sequelize from 'sequelize';
import mongoose from 'mongoose';
import config from '../config/database';
import Customer from '../app/models/Customer';
import File from '../app/models/File';
import Pet from '../app/models/Pet';
import Purchase from '../app/models/Purchase';
import Appointment from '../app/models/Appointment';
import Employee from '../app/models/Employee';
import Post from '../app/models/Post';
import Like from '../app/models/Like';
import Comment from '../app/models/Comment';

const models = [
  Customer,
  File,
  Pet,
  Purchase,
  Appointment,
  Employee,
  Post,
  Like,
  Comment,
];

class Database {
  constructor() {
    this.init();
    // this.mongo();
  }

  init() {
    this.connection = new Sequelize(config);

    models
      .map((model) => model.init(this.connection))
      .map(
        (model) => model.associate && model.associate(this.connection.models)
      );
  }

  mongo() {
    mongoose
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      })
      .then(() => {
        console.log('Mongo connected!');
      });
  }
}

export default new Database();
