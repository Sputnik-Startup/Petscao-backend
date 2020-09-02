import Sequelize from 'sequelize';
import config from '../config/database';
import Client from '../app/models/Client';
import File from '../app/models/File';
import Pet from '../app/models/Pet';

const models = [Client, File, Pet];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    this.connection = new Sequelize(config);

    models
      .map((model) => model.init(this.connection))
      .map(
        (model) => model.associate && model.associate(this.connection.models)
      );
  }

  mongo() {}
}

export default new Database();
