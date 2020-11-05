import * as Yup from 'yup';
import { Op } from 'sequelize';
import Customer from '../../models/Customer';
import File from '../../models/File';

class CustomerController {
  async show(request, response) {
    const { id: user_id } = request.params;

    if (!user_id) {
      return response.status(400).json({ error: 'User id not provided.' });
    }

    let target = {};
    try {
      target = await Customer.findByPk(user_id, {
        attributes: {
          exclude: ['password_hash', 'avatar_id'],
        },
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(target);
  }

  async update(request, response) {
    const { user_id } = request.headers;

    if (!user_id) {
      return response.status(400).json({ error: 'User id not provided.' });
    }

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      cpf: Yup.string().required(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
      age: Yup.number().required(),
      phone: Yup.string().required(),
      address: Yup.string().required(),
      city: Yup.string().required(),
      state: Yup.string().required(),
      neighborhood: Yup.string().required(),
      gender: Yup.string().required(),
      birth_date: Yup.date().required(),
      cep: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.json({ error: error.errors.join('. ') });
    }

    const { email, oldPassword } = request.body;
    const user = await Customer.findByPk(user_id);
    if (user.email !== email) {
      return response
        .status(400)
        .json({ error: 'You can only update your own profile.' });
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return response.status(401).json({ error: 'Password does not match.' });
    }

    await user.update(request.body);
    const updatedUser = await Customer.findByPk(user.id, {
      attributes: {
        exclude: ['password_hash', 'avatar_id'],
      },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return response.json(updatedUser);
  }

  async index(request, response) {
    const { page = 1, q, order = 'newest' } = request.query;
    const orderBy = {
      newest: 'DESC',
      oldest: 'ASC',
    };

    if (!orderBy[order]) {
      return response.status(400).json({ error: 'Invalid order value.' });
    }

    let users;

    const options = {
      limit: 25,
      offset: (page - 1) * 25,
      order: [['createdAt', orderBy[order]]],
      attributes: {
        exclude: ['password_hash', 'avatar_id'],
      },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    };

    try {
      if (q) {
        users = await Customer.findAll({
          where: {
            cpf: {
              [Op.like]: `${q}%`,
            },
          },
          ...options,
        });
      } else {
        users = await Customer.findAll(options);
      }
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(users);
  }
}

export default new CustomerController();
