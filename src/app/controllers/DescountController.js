import Purchase from '../models/Purchase';

class DescountController {
  async show(request, response) {
    const purchases = await Purchase.findAll({
      where: { user_id: request.userId, is_valid: true },
    });

    let descount;
    if (purchases.length >= 10) {
      descount = true;
    } else {
      descount = false;
    }

    return response.json({ valid_qt: purchases.length, descount });
  }
}

export default new DescountController();
