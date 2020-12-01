import * as Yup from 'yup';
import Purchase from '../../models/Purchase';
import Customer from '../../models/Customer';
import Pet from '../../models/Pet';
import File from '../../models/File';
import Notification from '../../schemas/Notification';

class PurchaseController {
  async create(request, response) {
    const schema = Yup.object().shape({
      user_id: Yup.string(),
      descount: Yup.string().required(),
      price: Yup.string().required(),
      total_price: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    // eslint-disable-next-line prefer-const
    let { descount, price, total_price, user_id = null } = request.body;

    const purchase = await Purchase.create({
      descount,
      price,
      total_price,
      user_id,
    });

    let purchases;
    if (user_id) {
      purchases = await Purchase.findAll({
        where: { user_id, is_valid: true },
        limit: 10,
      });
    }

    if (purchases.length === 10 && user_id) {
      await Notification.create({
        type: 'DESCOUNT',
        content:
          'Você atingiu 10 compras. Você terá um desconto no próximo agendamento.',
        to: user_id,
      });
    }

    const purchaseJoined = await Purchase.findByPk(purchase.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return response.json(purchaseJoined);
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
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
          {
            model: Pet,
            as: 'pet',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
        ],
      });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.json(purchases);
  }

  async update(request, response) {
    const schema = Yup.object().shape({
      descount: Yup.string().required(),
      price: Yup.string().required(),
      total_price: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { purchase_id } = request.params;
    const { descount, price, total_price } = request.body;
    let purchase;
    try {
      purchase = await Purchase.findByPk(purchase_id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
          {
            model: Pet,
            as: 'pet',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
        ],
      });

      if (!purchase) {
        return response.status(404).json({ error: 'Compra não encontrada.' });
      }

      await purchase.update({
        price,
        total_price,
        descount,
      });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.json(purchase);
  }

  async delete(request, response) {
    const { purchase_id } = request.params;

    const purchase = await Purchase.findByPk(purchase_id);

    if (!purchase) {
      return response.status(404).json({ error: 'Esta compra não existe.' });
    }

    try {
      await purchase.destroy();
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.status(204).send();
  }
}

export default new PurchaseController();
