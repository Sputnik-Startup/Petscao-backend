import Post from '../../models/Post';
import Like from '../../models/Like';

class LikeController {
  async create(request, response) {
    const { p: post_id } = request.query;

    if (!post_id) {
      return response.status(400).json({ error: 'Id not provided.' });
    }

    const post = await Post.findByPk(post_id);

    if (!post) {
      return response.status(400).json({ error: 'Post does not exists.' });
    }

    try {
      const liked = await Like.findOne({
        where: { post_id, customer_id: request.userId },
      });

      if (!liked) {
        await Like.create({
          post_id,
          customer_id: request.userId,
        });
      } else {
        return response
          .status(401)
          .json({ error: 'Permitted only one like per person.' });
      }
    } catch (err) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(204).send();
  }

  async delete(request, response) {
    const { p: post_id } = request.query;

    if (!post_id) {
      return response.status(400).json({ error: 'Id not provided.' });
    }

    const post = await Post.findByPk(post_id);

    if (!post) {
      return response.status(400).json({ error: 'Post does not exists.' });
    }

    try {
      const liked = await Like.findOne({
        where: { post_id, customer_id: request.userId },
      });

      if (liked) {
        await liked.destroy();
      } else {
        return response.status(401).json({ error: 'This post was not liked' });
      }
    } catch (err) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    return response.status(204).send();
  }
}

export default new LikeController();
