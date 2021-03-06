import Sequelize, { Model } from 'sequelize';

class Pet extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        name: Sequelize.STRING,
        type: Sequelize.STRING,
        sex: Sequelize.STRING,
        breed: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Customer, { foreignKey: 'owner_id', as: 'owner' });
    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
  }
}

export default Pet;
