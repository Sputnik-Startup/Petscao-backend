import * as Yup from 'yup';
import { Op } from 'sequelize';
import Customer from '../../models/Customer';
import File from '../../models/File';

class CustomerController {
  async show(request, response) {
    const { id: customer_id } = request.params;

    if (!customer_id) {
      return response.status(400).json({ error: 'User id not provided.' });
    }

    let target = {};
    try {
      target = await Customer.findByPk(customer_id, {
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
    const { customer_id } = request.params;

    if (!customer_id) {
      return response.status(400).json({ error: 'User id not provided.' });
    }

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      cpf: Yup.string().required(),
      password: Yup.string().test(
        'empty-check',
        'Password must be at least 8 characters',
        (password) => password.length >= 8 || password.length === 0
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
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const customer = await Customer.findByPk(customer_id);

    try {
      await customer.update(request.body);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }

    const updatedCustomer = await Customer.findByPk(customer_id, {
      attributes: {
        exclude: ['password_hash'],
      },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return response.json(updatedCustomer);
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
            [Op.or]: [
              {
                cpf: {
                  [Op.like]: `${q}%`,
                },
              },
              {
                name: {
                  [Op.like]: `${q}%`,
                },
              },
              {
                email: {
                  [Op.like]: `${q}%`,
                },
              },
            ],
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

  async delete(request, response) {
    const { customer_id } = request.params;

    if (!customer_id) {
      return response
        .status(400)
        .json({ error: 'Id do cliente não informado.' });
    }

    const customerExists = await Customer.findByPk(customer_id);

    if (!customerExists) {
      return response.status(404).json({ error: 'Este cliente não existe.' });
    }

    try {
      await customerExists.destroy();
    } catch (error) {
      return response.staus(500).json({ error: error.message });
    }

    return response.status(204).send();
  }
}

export default new CustomerController();
