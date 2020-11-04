import Sequelize, { Model } from 'sequelize';
import Comment from './Comment';
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
    const comments = await Comment.findAll({ where: { post_id } });

    this.likes = likes.length;
    this.comments = comments.length;
  }
}

export default Post;
