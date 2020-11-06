import Employee from '../models/Employee';

export default async (request, response, next) => {
  if (request.userId) {
    try {
      const user = await Employee.findOne({
        where: {
          id: request.userId,
        },
      });

      if (user) {
        return next();
      }

      return response
        .status(401)
        .json({ error: 'Only Employees can access this feature.' });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }
  }

  return response.staus(404).json({ error: 'User not logged.' });
};
