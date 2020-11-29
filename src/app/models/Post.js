import Sequelize, { Model } from 'sequelize';
import Comment from './Comment';
import Customer from './Customer';
import Employee from './Employee';
import File from './File';
import Like from './Like';

class Post extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        title: Sequelize.STRING,
        likes: Sequelize.VIRTUAL,
        comments: Sequelize.VIRTUAL,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
    this.belongsTo(models.File, { foreignKey: 'midia_id', as: 'midia' });
  }

  async getCommentsAndLikes(post_id) {
    const likes = await Like.findAll({ where: { post_id } });
    const comments = await Comment.findAll({
      where: { post_id },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name'],
          include: [{ model: File, as: 'avatar' }],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name'],
          include: [{ model: File, as: 'avatar' }],
        },
      ],
    });

    this.likes = likes;
    this.comments = comments;
  }
}

export default Post;
