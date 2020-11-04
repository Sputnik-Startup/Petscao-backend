import * as Yup from 'yup';
import File from '../../models/File';
import Pet from '../../models/Pet';
import clearJunk from '../../../utils/clearJunk';

class PetController {
  async create(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      type: Yup.string().required(),
      sex: Yup.string().required(),
      breed: Yup.string().required(),
    });

    if (
      request.headers['content-type'].split(';')[0] !== 'multipart/form-data'
    ) {
      return response
        .status(400)
        .json({ error: 'Content type must be multipart/form-data' });
    }

    const petAvatar = request.file;

    try {
      await schema.validate(request.body);
    } catch (error) {
      clearJunk(petAvatar.filename);
      return response.json({ error: error.errors.join('. ') });
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

      const { name, type, breed, sex } = request.body;

      const createdPet = await Pet.create({
        name,
        type,
        sex,
        breed: breed.toUpperCase(),
        owner_id: request.userId,
        avatar_id: avatarData ? avatarData.id : null,
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
    const { page = 1, order = 'newest' } = request.query;
    const orderBy = {
      newest: 'DESC',
      oldest: 'ASC',
    };

    if (!orderBy[order]) {
      return response.status(400).json({ error: 'Invalid order value.' });
    }

    let pet;
    try {
      pet = await Pet.findAll({
        order: [['createdAt', orderBy[order]]],
        limit: 25,
        offset: (page - 1) * 25,
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

  async update(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      type: Yup.string().required(),
      sex: Yup.string().required(),
      breed: Yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.json({ error: error.errors.join('. ') });
    }

    const { id } = request.params;

    if (!id) {
      return response.status(400).json({ error: 'Id not provided' });
    }

    let petUpdated;
    try {
      const petExists = await Pet.findOne({
        where: { id, owner_id: request.userId },
      });

      if (!petExists) {
        return response.status(404).json({ error: 'Pet not found.' });
      }

      petUpdated = await petExists.update(request.body);
    } catch (error) {
      return response.status(500).json({ error: 'Internal error' });
    }

    return response.json(petUpdated);
  }

  async delete(request, response) {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({ error: 'Id not provided.' });
    }

    try {
      const pet = await Pet.findOne({
        where: { id, owner_id: request.userId },
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path'],
          },
        ],
      });

      if (!pet) {
        return response.status(404).json({ error: 'Pet not found.' });
      }

      await clearJunk(pet.avatar.path, pet.avatar.id);

      await pet.destroy();
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(204).send();
  }
}

export default new PetController();
