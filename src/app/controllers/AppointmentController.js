import * as Yup from 'yup';
import {
  startOfHour,
  isBefore,
  parseISO,
  startOfWeek,
  addDays,
  startOfDay,
  endOfDay,
  subHours,
} from 'date-fns';
import { Op } from 'sequelize';

import Pet from '../models/Pet';
import Customer from '../models/Customer';
import Appointment from '../models/Appointment';
import File from '../models/File';

class AppointmentController {
  async create(request, response) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      pet_id: Yup.number().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const { date, pet_id } = request.body;

    const petExists = await Pet.findByPk(pet_id, {
      include: [
        {
          model: Customer,
          as: 'owner',
          attributes: ['id'],
        },
      ],
    });

    if (!petExists) {
      return response.status(404).json({ error: 'Pet not found.' });
    }

    if (petExists.owner.id !== request.userId) {
      return response
        .status(400)
        .json({ error: 'This pet does not belong to the logged in user.' });
    }

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return response
        .status(400)
        .json({ error: 'Past dates are not permitted' });
    }

    const available = await Appointment.findOne({
      where: {
        date: hourStart,
        canceled_at: null,
      },
    });

    if (available) {
      return response
        .status(400)
        .json({ error: 'Appointment date is not available.' });
    }

    const appointments = await Appointment.create({
      user_id: request.userId,
      pet_id,
      date: hourStart,
    });

    return response.json(appointments);
  }

  async index(request, response) {
    const weekDays = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    const { page = 1, day } = request.query;

    if (day && !Object.keys(weekDays).includes(day)) {
      return response.status(400).json({ error: 'Invalid day.' });
    }
    let appointments = {};
    const options = {
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
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
    };

    if (day) {
      const weekStarts = startOfWeek(new Date());
      const referDay = addDays(weekStarts, weekDays[day]);

      const betweenDate = [startOfDay(referDay), endOfDay(referDay)];

      appointments = await Appointment.findAll({
        where: {
          canceled_at: null,
          date: {
            [Op.between]: betweenDate,
          },
        },
        ...options,
      });
    } else {
      appointments = await Appointment.findAll({
        where: {
          canceled_at: null,
        },
        ...options,
      });
    }

    return response.json(appointments);
  }

  async delete(request, response) {
    const appointment = await Appointment.findByPk(request.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (appointment.user_id !== request.userId) {
      return response.status(401).json({
        error: "You don't have permission to cancel this appointment",
      });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return response.status(401).json({
        error: 'You can only cancel appointments 2 hours advance.',
      });
    }

    appointment.canceled_at = new Date();
    await appointment.save();

    return response.json(appointment);
  }
}

export default new AppointmentController();
