import Sequelize from 'sequelize';

class File extends Sequelize.Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${process.env.API_URL}/files/${this.path}`;
          },
        },
        devMobileUrl: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${process.env.MOBILE_API_URL}/files/${this.path}`;
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File;
