import Post from '../../models/Post';
import File from '../../models/File';
import Employee from '../../models/Employee';

class PostController {
  async index(request, response) {
    const { page = 1 } = request.query;
    let posts;

    try {
      posts = await Post.findAll({
        limit: 25,
        offset: (page - 1) * 25,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: File,
            as: 'midia',
            attributes: ['url', 'path', 'devMobileUrl'],
          },
          {
            model: Employee,
            as: 'employee',
            attributes: ['name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['url', 'path', 'devMobileUrl'],
              },
            ],
          },
        ],
      });
    } catch (error) {
      return response.status(500).json({ error: 'Internal error.' });
    }

    await Promise.all(
      posts.map(async (post) => {
        await post.getCommentsAndLikes(post.id);
        await post.verifyIfIsLiked(post.id, request.userId);
      })
    );

    return response.json(posts);
  }
}

export default new PostController();
