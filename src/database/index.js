import Sequelize from 'sequelize';
import config from '../config/database';
import Customer from '../app/models/Customer';
import File from '../app/models/File';
import Pet from '../app/models/Pet';

const models = [Customer, File, Pet];

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
