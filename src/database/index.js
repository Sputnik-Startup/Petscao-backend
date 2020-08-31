import Sequelize from 'sequelize';
import config from '../config/database.js';
import User from '../app/models/User.js';
import File from '../app/models/File.js';

const models = [User, File];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    this.connection = new Sequelize(config);

    models.map((model) => model.init(this.connection));
  }

  mongo() {}
}

export default new Database();
