import Customer from '../models/Customer';
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
        target = await Customer.findByPk(request.userId, {
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path'],
            },
          ],
        });
      } else if (context === 'pet') {
        const { petId } = request.query;

        if (!petId) {
          clearJunk(newAvatar.filename);
          return response.status(400).json({
            error: "Context is PET but petId wasn't provided in QUERY PARAMS.",
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
      }

      await clearJunk(target.avatar.path, target.avatar.id);

      const avatar = await File.create({
        name: newAvatar.originalname,
        path: newAvatar.filename,
      });

      await target.update({ avatar_id: avatar.id });
      avatarUpdated = await Customer.findByPk(request.userId, {
        attributes: {
          exclude: ['password_hash'],
        },
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
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(avatarUpdated);
  }
}

export default new AvatarController();
