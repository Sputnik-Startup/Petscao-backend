import * as Yup from 'yup';
import Comment from '../models/Comment';
import Customer from '../models/Customer';
import Employee from '../models/Employee';
import File from '../models/File';
import Notification from '../schemas/Notification';

class CommentController {
  async create(request, response) {
    const schema = Yup.object().shape({
      content: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { content } = request.body;
    const { p: post_id, context, notifyTo } = request.query;

    if (!['employee', 'customer'].includes(context)) {
      return response.status(400).json({
        error: 'Context value must be equals to "customer" or "employee".',
      });
    }

    if (!post_id) {
      return response.status(400).json({ error: 'Post id not provided' });
    }
    let commentResponse;
    try {
      let comment;
      if (context === 'employee') {
        comment = await Comment.create({
          content,
          customer_id: null,
          employee_id: request.userId,
          post_id,
        });
      } else {
        comment = await Comment.create({
          content,
          customer_id: request.userId,
          employee_id: null,
          post_id,
        });
      }

      commentResponse = await Comment.findByPk(comment.id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
        ],
      });
      if (notifyTo) {
        const notification = await Notification.create({
          to: notifyTo,
          content: 'Equipe Petscão te mencionou em um comentário.',
          title: 'Menção',
          midia: 'https://i.ibb.co/Yjn68nd/64-email-128.png',
        });

        const socket = request.redis.get(notifyTo);
        if (socket) {
          request.io.to(socket).emit('notification', { notification });
        }
      }
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.status(201).json(commentResponse);
  }

  async index(request, response) {
    const { p: post_id } = request.query;

    let comments;
    try {
      comments = await Comment.findAll({
        where: {
          post_id,
        },
        order: [['created_at', 'ASC']],
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
        ],
      });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(comments);
  }

  async delete(request, response) {
    const { comment_id } = request.params;
    const { context } = request.query;

    if (!['employee', 'customer'].includes(context)) {
      return response.status(400).json({
        error: 'Context value must be equals to "customer" or "employee".',
      });
    }

    if (!comment_id) {
      return response.status(400).json({ error: 'Comment id not provided.' });
    }

    try {
      if (context === 'customer') {
        const comment = await Comment.findOne({
          where: { id: comment_id, customer_id: request.userId },
        });

        if (!comment) {
          return response
            .status(401)
            .json({ error: "You must be comment's author" });
        }
      } else if (context === 'employee') {
        const comment = await Comment.findOne({
          where: { id: comment_id, employee_id: request.userId },
        });

        if (!comment) {
          return response
            .status(401)
            .json({ error: "You must be comment's author" });
        }
      }

      await Comment.destroy({
        where: {
          id: comment_id,
        },
      });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(204).send();
  }

  async update(request, response) {
    const schema = Yup.object().shape({
      content: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.json({ error: error.errors.join('. ') });
    }

    const { context } = request.query;

    if (!['employee', 'customer'].includes(context)) {
      return response.status(400).json({
        error: 'Context value must be equals to "customer" or "employee".',
      });
    }

    const { content } = request.body;
    const { comment_id } = request.params;

    try {
      if (context === 'customer') {
        const comment = await Comment.findOne({
          where: { id: comment_id, customer_id: request.userId },
        });

        if (!comment) {
          return response
            .status(401)
            .json({ error: "You must be comment's author" });
        }
      } else if (context === 'employee') {
        const comment = await Comment.findOne({
          where: { id: comment_id, employee_id: request.userId },
        });

        if (!comment) {
          return response
            .status(401)
            .json({ error: "You must be comment's author" });
        }
      }

      await Comment.update({ content }, { where: { id: comment_id } });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(204).send();
  }
}

export default new CommentController();
