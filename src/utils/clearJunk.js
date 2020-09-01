import { unlink } from 'fs';
import { resolve } from 'path';

export default (filename) => {
  try {
    unlink(
      resolve(__dirname, '..', '..', '..', 'tmp', 'uploads', filename),
      (err) => console.log(err)
    );

    return true;
  } catch (error) {
    return false;
  }
};
