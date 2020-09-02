import { unlink } from 'fs';
import { resolve } from 'path';
import File from '../app/models/File';

export default async (filename) => {
  try {
    unlink(
      resolve(__dirname, '..', '..', '..', 'tmp', 'uploads', filename),
      (err) => console.log(err)
    );

    await File.destroy({ where: { name: filename } });

    return true;
  } catch (error) {
    return false;
  }
};
