import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import Employee from '../../models/Employee';
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
      return response.json({ error: error.errors.join('. ') });
    }

    const { username, password } = request.body;

    const employee = await Employee.findOne({
      where: { username },
    });

    if (!(await employee.checkPassword(password))) {
      return response.status(400).json({ error: 'Password does not match' });
    }

    employee.password_hash = undefined;

    return response.json({
      user: employee,
      token: jwt.sign({ id: employee.id }, authConfig.secret),
    });
  }
}

export default new SessionController();
