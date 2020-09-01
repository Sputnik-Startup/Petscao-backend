import * as Yup from 'yup';
import Client from '../models/Client';
import File from '../models/File';
import clearJunk from '../../utils/clearJunk';

class ClientController {
  async create(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.email().required(),
      cpf: Yup.string().required(),
      password: Yup.string().required(),
      age: Yup.number().required(),
      phone: Yup.string().required(),
      address: Yup.string().required(),
      city: Yup.string().required(),
      state: Yup.string().required(),
      neighborhood: Yup.string().required(),
      gender: Yup.string().required(),
      birth_date: Yup.date().required(),
      cep: Yup.string().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }
    let client;
    let avatarData;
    try {
      const clientExists = await Client.findOne({
        where: {
          email: request.body.email,
        },
      });

      if (clientExists) {
        return response.status(400).json({ error: 'User already exists.' });
      }

      const avatar = request.file;
      if (avatar) {
        avatarData = await File.create({
          name: avatar.originalname,
          path: avatar.filename,
        });
      }

      client = await Client.create({
        ...request.body,
        avatar_id: avatarData.id || null,
      });
      delete client.password_hash;
    } catch (error) {
      console.log(error);
      if (avatarData) clearJunk(avatarData.filename);
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.json(client);
  }
}

export default new ClientController();
