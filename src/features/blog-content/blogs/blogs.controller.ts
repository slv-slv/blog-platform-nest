import { Controller } from '@nestjs/common';

@Controller('blogs')
export class BlogsController {
  async getAllBlogs(@Query('searchNameTerm') searchNameTerm: string | null = null, @Res() res: Response) {
    const pagingParams = res.locals.pagingParams as PagingParams;

    const blogs = await this.blogsQueryRepo.getAllBlogs(searchNameTerm, pagingParams);
    return blogs;
  }

  async getPostsByBlogId(req: Request, res: Response) {
    const pagingParams = res.locals.pagingParams;
    const blogId = req.params.blogId;
    const userId = res.locals.userId;

    const blog = await this.blogsRepo.findBlog(blogId);
    if (!blog) {
      res.status(HTTP_STATUS.NOT_FOUND_404).json({ error: 'Blog not found' });
      return;
    }

    const posts = await this.postsQueryRepo.getPosts(userId, pagingParams, blogId);
    res.status(HTTP_STATUS.OK_200).json(posts);
  }

  async findBlog(req: Request, res: Response) {
    const id = req.params.id;
    const blog = await this.blogsRepo.findBlog(id);
    if (!blog) {
      res.status(HTTP_STATUS.NOT_FOUND_404).json({ error: 'Blog not found' });
      return;
    }
    res.status(HTTP_STATUS.OK_200).json(blog);
  }

  async createBlog(req: Request, res: Response) {
    const { name, description, websiteUrl } = req.body;
    const newBlog = await this.blogsService.createBlog(name, description, websiteUrl);
    res.status(HTTP_STATUS.CREATED_201).json(newBlog);
  }

  async createPostForBlog(req: Request, res: Response) {
    const blogId = req.params.blogId;
    const { title, shortDescription, content } = req.body;

    const result = await this.postsService.createPost(title, shortDescription, content, blogId);

    if (result.status !== RESULT_STATUS.CREATED) {
      res.status(httpCodeByResult(result.status)).json(result.extensions);
      return;
    }

    res.status(HTTP_STATUS.CREATED_201).json(result.data);
  }

  async updateBlog(req: Request, res: Response) {
    const id = req.params.id;
    const { name, description, websiteUrl } = req.body;
    const result = await this.blogsService.updateBlog(id, name, description, websiteUrl);
    if (result.status !== RESULT_STATUS.NO_CONTENT) {
      res.status(httpCodeByResult(result.status)).json(result.extensions);
      return;
    }

    res.status(HTTP_STATUS.NO_CONTENT_204).end();
  }

  async deleteBlog(req: Request, res: Response) {
    const id = req.params.id;
    const result = await this.blogsService.deleteBlog(id);
    if (result.status !== RESULT_STATUS.NO_CONTENT) {
      res.status(httpCodeByResult(result.status)).json(result.extensions);
      return;
    }

    res.status(HTTP_STATUS.NO_CONTENT_204).end();
  }
}
