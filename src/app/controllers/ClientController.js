import * as Yup from 'yup';
import { Op } from 'sequelize';
import Client from '../models/Client';
import File from '../models/File';
import clearJunk from '../../utils/clearJunk';
import validateCpf from '../../utils/validateCpf';

class ClientController {
  async create(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      cpf: Yup.string().required(),
      password: Yup.string().min(8).required(),
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

    const avatar = request.file;

    if (!(await schema.isValid(request.body))) {
      clearJunk(avatar.filename);
      return response.status(400).json({ error: 'Validation fails.' });
    }
    let client;
    let avatarData;

    if (!validateCpf(request.body.cpf)) {
      clearJunk(avatar.filename);
      return response.status(400).json({ error: 'Invalid CPF.' });
    }

    try {
      const clientExists = await Client.findOne({
        where: {
          [Op.or]: [{ email: request.body.email }, { cpf: request.body.cpf }],
        },
      });

      if (clientExists) {
        clearJunk(avatar.filename);
        return response.status(400).json({ error: 'User already exists.' });
      }

      if (avatar) {
        avatarData = await File.create({
          name: avatar.originalname,
          path: avatar.filename,
        });
      }

      const createdUser = await Client.create({
        ...request.body,
        avatar_id: avatarData.id || null,
      });

      client = await Client.findByPk(createdUser.id, {
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
      await clearJunk(avatar.filename, avatarData && avatarData.id);
      return response.status(500).json({ error: 'Internal error.' });
    }
    return response.json(client);
  }

  async show(request, response) {
    let loggedUser;
    try {
      loggedUser = await Client.findByPk(request.userId, {
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

    return response.json(loggedUser);
  }

  async update(request, response) {
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

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails' });
    }

    const { email, oldPassword } = request.body;
    const user = await Client.findByPk(request.userId);
    if (user.email !== email) {
      return response
        .status(400)
        .json({ error: 'You can only update your own profile.' });
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return response.status(401).json({ error: 'Password does not match.' });
    }

    await user.update(request.body);
    const updatedUser = await Client.findByPk(user.id, {
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
}

export default new ClientController();
