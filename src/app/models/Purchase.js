import Sequelize, { Model } from 'sequelize';

class Purchase extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        descount: Sequelize.STRING,
        price: Sequelize.STRING,
        total_price: Sequelize.STRING,
        is_valid: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Customer, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.Pet, { foreignKey: 'pet_id', as: 'pet' });
  }
}

export default Purchase;
