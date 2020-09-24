import * as Yup from 'yup';
import Purchase from '../../models/Purchase';

class PurchaseController {
  async create(request, response) {
    const schema = Yup.object().shape({
      descount: Yup.string().required(),
      price: Yup.string().required(),
      total_price: Yup.string().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    // eslint-disable-next-line prefer-const
    let { descount, price, total_price, user_id, pet_id } = request.body;

    if (!user_id || !pet_id) {
      user_id = null;
      pet_id = null;
    }

    const purchase = await Purchase.create({
      descount,
      price,
      total_price,
      user_id,
      pet_id,
    });

    return response.json(purchase);
  }

  async index(request, response) {
    const { page = 1, order = 'newest' } = request.query;
    const orderBy = {
      newest: 'DESC',
      oldest: 'ASC',
    };

    if (!orderBy[order]) {
      return response.status(400).json({ error: 'Invalid order value.' });
    }

    let purchases = [];
    try {
      purchases = await Purchase.findAll({
        order: [['createdAt', orderBy[order]]],
        limit: 25,
        offset: (page - 1) * 25,
      });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(purchases);
  }
}

export default new PurchaseController();
