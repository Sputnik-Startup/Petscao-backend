import * as Yup from 'yup';
import Comment from '../models/Comment';
import Customer from '../models/Customer';
import Employee from '../models/Employee';

class CommentController {
  async create(request, response) {
    const schema = Yup.object().shape({
      content: Yup.string().required(),
      ref: Yup.string().required().equals(['comment', 'answer']),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.json({ error: error.errors.join('. ') });
    }

    const { ref, content } = request.body;
    const { p: post_id, context } = request.query;

    if (!['employee', 'customer'].includes(context)) {
      return response.status(400).json({
        error: 'Context value must be equals to "customer" or "employee".',
      });
    }

    if (!post_id) {
      return response.status(400).json({ error: 'Post id not provided' });
    }

    let comment;
    try {
      if (context === 'employee') {
        comment = await Comment.create({
          content,
          ref,
          customer_id: null,
          employee_id: request.userId,
          post_id,
        });
      } else {
        comment = await Comment.create({
          content,
          ref,
          customer_id: request.userId,
          employee_id: null,
          post_id,
        });
      }
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(201).json(comment);
  }

  async index(request, response) {
    const { p: post_id } = request.query;

    let comments;
    try {
      comments = await Comment.findAll({
        where: {
          post_id,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['name'],
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['name'],
          },
        ],
      });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(comments);
  }
}

export default new CommentController();
