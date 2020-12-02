import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import Customer from '../../models/Customer';
import File from '../../models/File';
import authConfig from '../../../config/auth';

class SessionController {
  async create(request, response) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { email, password } = request.body;

    const customer = await Customer.findOne({
      where: { email },
      include: [
        {
          model: File,
          as: 'avatar',
        },
      ],
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
