import * as Yup from 'yup';
import Purchase from '../models/Purchase';

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
}

export default new PurchaseController();
