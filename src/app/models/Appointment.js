import Sequelize, { Model } from 'sequelize';
import { isBefore, subHours } from 'date-fns';
import Purchase from './Purchase';

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date());
          },
        },
        cancelable: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(new Date(), subHours(this.date, 2));
          },
        },
        descount: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );

    this.addHook('beforeSave', async (appointment) => {
      const purchases = await Purchase.findAll({
        where: { user_id: appointment.user_id, is_valid: true },
        limit: 10,
      });

      if (purchases.length === 10) {
        await Purchase.update(
          { is_valid: false },
          {
            where: { user_id: appointment.user_id, is_valid: true },
            limit: 10,
          }
        );
        appointment.descount = true;
        return;
      }
      appointment.descount = false;
    });

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Customer, { foreignKey: 'user_id', as: 'customer' });
    this.belongsTo(models.Pet, { foreignKey: 'pet_id', as: 'pet' });
  }
}

export default Appointment;
