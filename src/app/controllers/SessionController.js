import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  static async create(request, response) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Credencials not provided.' });
    }

    const { email, password } = request.body;

    const user = await User.findOne({ where: { email } });

    if (!(await user.checkPassword(password))) {
      return response.status(400).json({ error: 'Password does not match' });
    }

    const { id, name } = user;

    return response.json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id }, authConfig.secret),
    });
  }
}

export default SessionController;
