import { getYear } from 'date-fns';
import sequelize, { Op } from 'sequelize';
import Appointment from '../../models/Appointment';

class AppointmentByMonth {
  async index(resquest, response) {
    const months = [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
    ];

    const monthName = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ];

    const currentYear = getYear(new Date());

    const appointments = await Promise.all(
      months.map(async (month) =>
        Appointment.findAll({
          where: {
            [Op.and]: [
              sequelize.where(
                sequelize.fn('month', sequelize.col('date')),
                month
              ),
              sequelize.where(
                sequelize.fn('YEAR', sequelize.col('date')),
                currentYear
              ),
              { canceled_at: null },
            ],
          },
        })
      )
    );

    const total = appointments.reduce(
      (acc, value) => Number(acc) + Number(value.length)
    );

    const appointmentObj = {};

    appointments.forEach((month, index) => {
      appointmentObj[monthName[index]] = month.length;
    });

    return response.json({ values: appointmentObj, total });
  }
}

export default new AppointmentByMonth();
