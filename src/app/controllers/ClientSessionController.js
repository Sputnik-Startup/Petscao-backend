import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import Client from '../models/Client';
import authConfig from '../../config/auth';

class SessionController {
  async create(request, response) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Credencials not provided.' });
    }

    const { email, password } = request.body;

    const client = await Client.findOne({
      where: { email },
    });

    if (!(await client.checkPassword(password))) {
      return response.status(400).json({ error: 'Password does not match' });
    }

    client.password_hash = undefined;

    return response.json({
      user: client,
      token: jwt.sign({ id: client.id }, authConfig.secret),
    });
  }
}

export default new SessionController();
