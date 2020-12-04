import Notification from '../../schemas/Notification';
import Customer from '../../models/Customer';
import Employee from '../../models/Employee';

class NotificationController {
  async create(request, response) {
    const { content, sendTo, title, midia } = request.body;

    if (!content) {
      return response.status(400).json({ error: 'Content not probided' });
    }

    let notification;
    try {
      if (sendTo === 'all') {
        const customers = await Customer.findAll({ attributes: ['id'] });
        const employees = await Employee.findAll({ attributes: ['id'] });

        const targets = [
          ...customers.map((c) => c.id),
          ...employees.map((e) => e.id),
        ];

        notification = await Promise.all(
          targets.map((id) =>
            Notification.create({
              content,
              to: id,
              title,
              midia,
            })
          )
        );

        request.io.to('customers').emit('notification', { notification });
        request.io.to('employees').emit('notification', { notification });
      } else if (sendTo === 'customers') {
        const customersArr = await Customer.findAll({ attributes: ['id'] });
        const customers = [...customersArr.map((c) => c.id)];

        notification = await Promise.all(
          customers.map((id) =>
            Notification.create({
              content,
              to: id,
              title,
              midia,
            })
          )
        );

        request.io.to('customers').emit('notification', { notification });
      } else if (sendTo === 'employees') {
        const employeesArr = await Employee.findAll({ attributes: ['id'] });
        const employees = [...employeesArr.map((c) => c.id)];

        notification = await Promise.all(
          employees.map((id) =>
            Notification.create({
              content,
              to: id,
              title,
              midia,
            })
          )
        );

        request.io.to('employees').emit('notification', { notification });
      }
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(notification);
  }

  async index(request, response) {
    let notifications;

    try {
      notifications = await Notification.find({ to: request.userId }).sort({
        createdAt: -1,
      });

      await Notification.updateMany(
        { to: request.userId, read: false },
        { read: true }
      );
    } catch (error) {
      return response.status(500).json({ error: 'Internal error' });
    }

    return response.json(notifications);
  }

  async updateMany(request, response) {
    try {
      await Notification.updateMany(
        { to: request.userId, read: false },
        { read: true }
      );
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.status(204).send();
  }
}

export default new NotificationController();
