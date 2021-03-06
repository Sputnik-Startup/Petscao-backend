import * as Yup from 'yup';

import Queue from '../../../lib/Queue';
import ForgotPassMail from '../../jobs/ForgotPassMail';
import Customer from '../../models/Customer';

class ForgotPassController {
  async get(request, response) {
    const { e: email } = request.query;

    if (!email) {
      return response.status(400).json({ error: 'Email not provided' });
    }

    let link;
    try {
      const customer = await Customer.findOne({
        where: { email },
      });

      if (!customer) {
        return response
          .status(404)
          .json({ error: `Customer with email ${email} does not exists.` });
      }

      link = `${process.env.FP_CLIENT_URL}${customer.id}`;

      await Queue.add(ForgotPassMail.key, {
        customer: { name: 'Maxwell Macedo' },
        link,
      });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(204).send();
  }

  async create(request, response) {
    const schema = Yup.object().shape({
      password: Yup.string().min(6).required(),
      confirmPassword: Yup.string().oneOf([Yup.ref('password')]),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { c: id } = request.query;

    if (!id) {
      return response.status(400).json({ error: 'Customer id not provided.' });
    }

    const { password } = request.body;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return response.status(400).json({ error: 'Invalid id.' });
    }

    try {
      await customer.update({ password });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(204).send();
  }
}

export default new ForgotPassController();
