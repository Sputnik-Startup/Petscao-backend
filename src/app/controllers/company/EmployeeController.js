import * as Yup from 'yup';
import { Op } from 'sequelize';
import Employee from '../../models/Employee';
import File from '../../models/File';
import clearJunk from '../../../utils/clearJunk';
import validateCpf from '../../../utils/validateCpf';

class EmployeeController {
  async create(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      username: Yup.string().required(),
      cpf: Yup.string().required(),
      password: Yup.string().min(8).required(),
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
      access: Yup.string().required(),
    });

    const avatar = request.file;

    if (
      request.headers['content-type'].split(';')[0] !== 'multipart/form-data'
    ) {
      if (avatar) clearJunk(avatar.filename);
      return response
        .status(400)
        .json({ error: 'Content type must be multipart/form-data' });
    }

    try {
      await schema.validate(request.body);
    } catch (error) {
      if (avatar) clearJunk(avatar.filename);
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    if (!validateCpf(request.body.cpf)) {
      if (avatar) clearJunk(avatar.filename);
      return response.status(400).json({ error: 'Invalid CPF.' });
    }

    let employee;
    let avatarData;

    try {
      const EmployeeExists = await Employee.findOne({
        where: {
          [Op.or]: [
            { username: request.body.username },
            { cpf: request.body.cpf },
          ],
        },
      });

      if (EmployeeExists) {
        if (avatar) clearJunk(avatar.filename);
        return response.status(400).json({ error: 'User already exists.' });
      }

      if (avatar) {
        avatarData = await File.create({
          name: avatar.originalname,
          path: avatar.filename,
        });
      }

      const createdUser = await Employee.create({
        ...request.body,
        avatar_id: avatarData ? avatarData.id : null,
      });

      employee = await Employee.findByPk(createdUser.id, {
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
      if (avatar) await clearJunk(avatar.filename, avatarData && avatarData.id);

      return response.status(500).json({ error: 'Internal error.' });
    }
    return response.json(employee);
  }

  async show(request, response) {
    let loggedUser;
    try {
      loggedUser = await Employee.findByPk(request.userId, {
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
      name: Yup.string().required('Nome obrigatório'),
      username: Yup.string().required('Nome de usuário obrigatório'),
      cpf: Yup.string()
        .required('CPF obrigatório')
        .matches(
          /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
          'A formatação está incorreta. Digite o CPF novamente.'
        )
        .test('validate-cpf', 'CPF inválido', validateCpf),
      password: Yup.string().test(
        'empty-check',
        'Senha deve ter no mínimo 8 caracteres',
        (password) => password.length >= 8 || password.length === 0
      ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password
          ? field
              .required('É necessário confirmar a nova senha')
              .oneOf([Yup.ref('password')], 'As senhas não são iguais')
          : field
      ),
      age: Yup.number()
        .integer('A idade deve ser um número inteiro')
        .required('Idade obrigatório')
        .typeError('Informe a idade'),
      phone: Yup.string()
        .required('Telefone obrigatório')
        .matches(
          /(\(\d{2}\)\s)(\d{5}-\d{4})/g,
          'A formatação está incorreta. Digite o telefone novamente.'
        ),
      address: Yup.string().required('Endereço obrigatório'),
      city: Yup.string().required('Cidade obrigatório'),
      state: Yup.string().required('Estado obrigatório'),
      neighborhood: Yup.string().required('Bairro obrigatório'),
      gender: Yup.string().required('Gênero obrigatório'),
      birth_date: Yup.date()
        .required('Data de nascimento obrigatório')
        .typeError('Data inválida'),
      cep: Yup.string()
        .required('CEP obrigatório')
        .matches(
          /^\d{5}-\d{3}/g,
          'A formatação está incorreta. Digite o CEP novamente.'
        ),
      access: Yup.string().required('Nível de acesso obrigatório'),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { username } = request.body;
    const { id } = request.params;
    const user = await Employee.findByPk(id);

    if (user.username !== username) {
      return response
        .status(400)
        .json({ error: 'You can only update your own profile.' });
    }

    await user.update(request.body);
    const updatedUser = await Employee.findByPk(user.id, {
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

    return response.json(updatedUser);
  }

  async index(request, response) {
    const { page = 1, order = 'newest', q } = request.query;
    const orderBy = {
      newest: 'DESC',
      oldest: 'ASC',
    };

    if (!orderBy[order]) {
      return response.status(400).json({ error: 'Invalid order value.' });
    }

    let employees = [];
    try {
      employees = await Employee.findAll({
        where: q
          ? {
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
                  username: {
                    [Op.like]: `${q}%`,
                  },
                },
              ],
            }
          : {},
        order: [['createdAt', orderBy[order]]],
        attributes: {
          exclude: ['password_hash'],
        },
        limit: 25,
        offset: (page - 1) * 25,
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.json(employees);
  }
}

export default new EmployeeController();
