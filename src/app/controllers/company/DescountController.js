import Purchase from '../../models/Purchase';

class DescountController {
  async show(request, response) {
    const { u: user_id } = request.query;

    if (!user_id) {
      return response.status(400).json({ error: 'User_id not provided.' });
    }

    const purchases = await Purchase.findAll({
      where: { user_id, is_valid: true },
      limit: 10,
    });

    let descount;
    if (purchases.length === 10) {
      descount = true;
    } else {
      descount = false;
    }

    return response.json({ valid_qt: purchases.length, descount });
  }

  async update(request, response) {
    const { u: user_id } = request.query;

    if (!user_id) {
      return response.status(400).json({ error: 'User_id not provided.' });
    }

    await Purchase.update(
      { is_valid: false },
      {
        where: { user_id, is_valid: true },
        limit: 10,
      }
    );

    return response.status(204).send();
  }
}

export default new DescountController();
