import Employee from '../models/Employee';

export default async (request, response, next) => {
  if (request.userId) {
    try {
      const user = await Employee.findByPk(request.userId);

      if (user.access === 'adm') {
        return next();
      }

      return response.status(401).json({ error: 'Access denied.' });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }
  }

  return response.staus(404).json({ error: 'User not logged.' });
};
