import * as Yup from 'yup';
import { startOfHour, isBefore, parseISO } from 'date-fns';
import 'date-fns/locale/pt-BR';

import Pet from '../models/Pet';
import Customer from '../models/Customer';
import Appointment from '../models/Appointment';

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
}

export default new AppointmentController();
