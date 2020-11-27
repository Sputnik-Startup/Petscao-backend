import Customer from '../models/Customer';
import Employee from '../models/Employee';
import File from '../models/File';
import clearJunk from '../../utils/clearJunk';
import Pet from '../models/Pet';

class AvatarController {
  async update(request, response) {
    const { context } = request.query;

    if (!context) {
      return response
        .status(400)
        .json({ error: 'CONTEXT not provided in QUERY PARAMS.' });
    }

    let avatarUpdated;
    const newAvatar = request.file;
    try {
      if (!newAvatar) {
        clearJunk(newAvatar.filename);
        return response.status(400).json({ error: 'New Avatar not provided.' });
      }
      let target;
      if (context === 'customer') {
        const { target_id: user_id = null } = request.params;
        target = await Customer.findByPk(user_id || request.userId, {
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path'],
            },
          ],
        });
      } else if (context === 'pet') {
        const { target_id: petId = null } = request.params;

        if (!petId) {
          clearJunk(newAvatar.filename);
          return response.status(400).json({
            error: "Context is PET but petId wasn't provided in PARAMS.",
          });
        }
        target = await Pet.findByPk(petId, {
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path'],
            },
          ],
        });
      } else {
        const { target_id: user_id = null } = request.params;
        target = await Employee.findByPk(user_id || request.userId, {
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path'],
            },
          ],
        });
      }

      if (target.avatar) await clearJunk(target.avatar.path, target.avatar.id);

      const avatar = await File.create({
        name: newAvatar.originalname,
        path: newAvatar.filename,
      });

      await target.update({ avatar_id: avatar.id });

      const modelCondition = {
        customer: Customer,
        pet: Pet,
        employee: Employee,
      };

      avatarUpdated = await modelCondition[context].findByPk(target.id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
    } catch (error) {
      await clearJunk(newAvatar.filename, avatarUpdated && avatarUpdated.id);
      return response.status(500).json({ error: error.message });
    }

    return response.json(avatarUpdated);
  }
}

export default new AvatarController();
