import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import Employee from '../../models/Employee';
import File from '../../models/File';
import authConfig from '../../../config/auth';

class SessionController {
  async create(request, response) {
    const schema = Yup.object().shape({
      username: Yup.string().required(),
      password: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { username, password } = request.body;

    const employee = await Employee.findOne({
      where: { username },
      include: [
        {
          model: File,
          as: 'avatar',
        },
      ],
    });

    if (!employee) {
      return response.status(404).json({ error: 'Nome de usuário incorreto' });
    }

    if (!(await employee.checkPassword(password))) {
      return response.status(400).json({ error: 'Senha incorreta' });
    }

    employee.password_hash = undefined;

    return response.json({
      user: employee,
      token: jwt.sign({ id: employee.id }, authConfig.secret),
    });
  }
}

export default new SessionController();
