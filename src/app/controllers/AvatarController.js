import Client from '../models/Client';
import File from '../models/File';
import clearJunk from '../../utils/clearJunk';

class AvatarController {
  async update(request, response) {
    let avatarUpdated;
    try {
      const newAvatar = request.file;

      if (!newAvatar) {
        return response.status(400).json({ error: 'New Avatar not provided.' });
      }

      const user = await Client.findByPk(request.userId, {
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path'],
          },
        ],
      });

      await clearJunk(user.avatar.path, user.avatar.id);

      const avatar = await File.create({
        name: newAvatar.originalname,
        path: newAvatar.filename,
      });

      await user.update({ avatar_id: avatar.id });
      avatarUpdated = await Client.findByPk(request.userId, {
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
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(avatarUpdated);
  }
}

export default new AvatarController();
