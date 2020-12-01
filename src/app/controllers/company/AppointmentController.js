import * as Yup from 'yup';
import {
  startOfHour,
  isBefore,
  parseISO,
  startOfWeek,
  addDays,
  startOfDay,
  endOfDay,
  format,
} from 'date-fns';
import { Op } from 'sequelize';

import Pet from '../../models/Pet';
import Customer from '../../models/Customer';
import Appointment from '../../models/Appointment';
import File from '../../models/File';
import Queue from '../../../lib/Queue';
import CancellationMail from '../../jobs/CancellationMail';
import Notification from '../../schemas/Notification';

class AppointmentController {
  async create(request, response) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      pet_id: Yup.string().required(),
      user_id: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { date, pet_id, user_id } = request.body;

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

    if (petExists.owner.id !== user_id) {
      return response
        .status(400)
        .json({ error: 'Esse pet não pertence à este usuário' });
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
      user_id,
      pet_id,
      date: hourStart,
    });

    const appointment = await Appointment.findByPk(appointments.id, {
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

    return response.json(appointment);
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
    const { page = 1, day, date: dateTarget, order = 'newest' } = request.query;
    const orderBy = {
      newest: 'DESC',
      oldest: 'ASC',
    };

    if (!orderBy[order]) {
      return response.status(400).json({ error: 'Invalid order value.' });
    }

    if (day && !Object.keys(weekDays).includes(day)) {
      return response.status(400).json({ error: 'Invalid day.' });
    }
    let appointments = {};
    const options = {
      order: [['date', orderBy[order]]],
      limit: 20,
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
    } else if (dateTarget) {
      const dateQuery = startOfDay(parseISO(dateTarget));

      const betweenDate = [dateQuery, endOfDay(parseISO(dateTarget))];
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

    const total = await Appointment.count({ distinct: true, col: 'id' });
    const canceled = await Appointment.count({
      where: { canceled_at: { [Op.not]: null } },
      distinct: true,
      col: 'id',
    });

    const responseData = { total, canceled, appointments };

    return response.json(responseData);
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

    appointment.cancelable = false;
    appointment.canceled_at = new Date();
    await appointment.save();

    await Queue.add(CancellationMail.key, { appointment });
    const notification = await Notification.create({
      title: 'Agendamento cancelado',
      content: `O agendamento para o dia ${format(
        parseISO(appointment.date),
        "dd/MM/yyyy à's' hh:mm'h'"
      )} foi cancelado`,
      to: appointment.customer_id,
    });

    const socket = request.redis.get(appointment.customer_id);
    if (socket) {
      request.io.to(socket).emit('notification', { notification });
    }

    return response.json(appointment);
  }

  async update(request, response) {
    const { id } = request.params;

    if (!id) {
      return response
        .status(400)
        .json({ error: 'Appointment Id not provided.' });
    }

    const schema = Yup.object().shape({
      date: Yup.date().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({ error: error.errors.join('. ') });
    }

    const { date } = request.body;

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return response
        .status(400)
        .json({ error: 'Past dates are not permitted' });
    }

    const available = await Appointment.findOne({
      where: {
        id: {
          [Op.not]: id,
        },
        date: hourStart,
        canceled_at: null,
      },
    });

    if (available) {
      return response
        .status(400)
        .json({ error: 'Appointment date is not available.' });
    }

    await Appointment.update(
      {
        date: hourStart,
      },
      {
        where: { id },
      }
    );

    const appointments = await Appointment.findByPk(id, {
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

    return response.json(appointments);
  }
}

export default new AppointmentController();
