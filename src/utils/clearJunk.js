import { unlink } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
import File from '../app/models/File';

export default async (filename, id) => {
  try {
    await promisify(unlink)(
      resolve(__dirname, '..', '..', 'tmp', 'uploads', filename)
    );

    await File.destroy({ where: { id } });
  } catch (error) {
    throw new Error(error);
  }
};
