import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
  isSunday,
  parseISO,
  isBefore,
} from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';

class AvailableController {
  async show(request, response) {
    const { date } = request.query;

    if (!date) {
      return response.status(400).json({ error: 'Invalid date' });
    }

    if (isSunday(parseISO(date))) {
      return response.status(400).json({ error: "We don't work on Sundays." });
    }

    const dayStart = startOfDay(parseISO(date));

    if (isBefore(dayStart, startOfDay(new Date()))) {
      return response
        .status(400)
        .json({ error: 'Datas passadas não são permitidas' });
    }

    const searchDate = parseISO(date);

    const appointments = await Appointment.findAll({
      where: {
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });

    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
    ];

    const available = schedule.map((time) => {
      const [hour, minute] = time.split(':');
      const value = setSeconds(
        setMinutes(setHours(searchDate, hour), minute),
        0
      );

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available:
          isAfter(value, new Date()) &&
          !appointments.find((a) => format(a.date, 'HH:mm') === time),
      };
    });

    return response.json(available);
  }
}

export default new AvailableController();
