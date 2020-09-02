import * as Yup from 'yup';
import File from '../models/File';
import Pet from '../models/Pet';
import clearJunk from '../../utils/clearJunk';

class PetController {
  async create(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      type: Yup.string().required(),
    });

    const petAvatar = request.file;
    if (
      request.headers['content-type'].split(';')[0] !== 'multipart/form-data'
    ) {
      clearJunk(petAvatar.filename);
      return response
        .status(400)
        .json({ error: 'Content type must be multipart/form-data' });
    }
    if (!(await schema.isValid(request.body))) {
      clearJunk(petAvatar.filename);
      return response.status(400).json({ error: 'Validation fails.' });
    }

    let avatar;
    let pet;
    try {
      let avatarData;
      if (petAvatar) {
        avatarData = await File.create({
          name: petAvatar.originalname,
          path: petAvatar.filename,
        });
      }

      const { name, type } = request.body;

      const createdPet = await Pet.create({
        name,
        type,
        owner_id: request.userId,
        avatar_id: avatarData.id || null,
      });

      pet = await Pet.findByPk(createdPet.id, {
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
    } catch (error) {
      if (petAvatar) clearJunk(petAvatar.filename, avatar && avatar.id);
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(pet);
  }

  async index(request, response) {
    let pet;
    try {
      pet = await Pet.findAll({
        where: { owner_id: request.userId },
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

    return response.json(pet);
  }
}

export default new PetController();
