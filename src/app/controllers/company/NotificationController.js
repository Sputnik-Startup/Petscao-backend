import Notification from '../../schemas/Notification';
import Customer from '../../models/Customer';
import Employee from '../../models/Employee';

class NotificationController {
  async create(request, response) {
    const { content, type = 'ALERT', sendTo, to, title } = request.body;

    const typeValues = ['DESCOUNT', 'HAPPY_BIRTHDAY', 'ALERT', 'NOTIFY'];

    if (!content) {
      return response.status(400).json({ error: 'Content not probided' });
    }

    if (!typeValues.includes(type)) {
      return response.status(400).json({
        error:
          '"To" value must be equals to "DESCOUNT", "HAPPY_BIRTHDAY", "ALERT" or "NOTIFY".',
      });
    }

    let notification;
    try {
      if (to && !sendTo) {
        if (Array.isArray(to)) {
          notification = await Promise.all(
            to.map(async (id) => {
              await Notification.create({
                type,
                content,
                to: id,
                title,
              });
            })
          );

          const sockets = to.map((id) => request.redis.get(id));
          sockets.forEach((socket) =>
            request.io.to(socket).emit('notification', { notification })
          );
        } else if (typeof to === 'string') {
          notification = await Notification.create({
            type,
            content,
            to,
            title,
          });

          const socket = request.redis.get(to);
          request.io.to(socket).emit('notification', { notification });
        }
      } else if (sendTo === 'all') {
        const customers = await Customer.findAll({ attributes: ['id'] });
        const employees = await Employee.findAll({ attributes: ['id'] });

        const targets = [
          ...customers.map((c) => c.id),
          ...employees.map((e) => e.id),
        ];

        notification = await Promise.all(
          targets.map((id) =>
            Notification.create({
              type,
              content,
              to: id,
              title,
            })
          )
        );

        request.io.to('customers', { notification });
        request.io.to('employees', { notification });
      } else if (sendTo === 'customers') {
        const customersArr = await Customer.findAll({ attributes: ['id'] });
        const customers = [...customersArr.map((c) => c.id)];

        notification = await Promise.all(
          customers.map((id) =>
            Notification.create({
              type,
              content,
              to: id,
              title,
            })
          )
        );

        request.io.to('customers', { notification });
      } else if (sendTo === 'employees') {
        const employeesArr = await Employee.findAll({ attributes: ['id'] });
        const employees = [...employeesArr.map((c) => c.id)];

        notification = await Promise.all(
          employees.map((id) =>
            Notification.create({
              type,
              content,
              to: id,
              title,
            })
          )
        );

        request.io.to('employees', { notification });
      }
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(notification);
  }

  async index(request, response) {
    let notifications;
    const { qt } = request.query;
    try {
      notifications =
        qt === 'all'
          ? await Notification.find({ to: request.userId }).sort({
              createdAt: -1,
            })
          : await Notification.find({ to: request.userId })
              .limit(5)
              .sort({ createdAt: -1 });

      await Notification.updateMany(
        { to: request.userId, read: false },
        { read: true }
      );
    } catch (error) {
      return response.status(500).json({ error: 'Internal error' });
    }

    return response.json(notifications);
  }
}

export default new NotificationController();
