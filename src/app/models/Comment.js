import Sequelize, { Model } from 'sequelize';

class Comment extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        content: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer',
    });
    this.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
    this.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post',
    });
  }
}

export default Comment;
