import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer';
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

    const customer = await Customer.findOne({
      where: { email },
    });

    if (!(await customer.checkPassword(password))) {
      return response.status(400).json({ error: 'Password does not match' });
    }

    customer.password_hash = undefined;

    return response.json({
      user: customer,
      token: jwt.sign({ id: customer.id }, authConfig.secret),
    });
  }
}

export default new SessionController();
