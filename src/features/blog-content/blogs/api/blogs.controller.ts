import { Controller, Get, NotFoundException, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { BlogsQueryRepository } from '../infrastructure/mongoose/blogs.query-repository.js';
import { BlogsRepository } from '../infrastructure/mongoose/blogs.repository.js';
import { BlogsPaginatedType, BlogType, GetBlogsQueryParams } from '../blogs.types.js';
import { GetPostsQueryParams, PostsPaginatedType } from '../../posts/posts.types.js';
import { PostsQueryRepository } from '../../posts/infrastructure/mongoose/posts.query-repository.js';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsRepo: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllBlogs(@Query() query: GetBlogsQueryParams): Promise<BlogsPaginatedType> {
    const { searchNameTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };

    const blogs = await this.blogsQueryRepository.getAllBlogs(searchNameTerm, pagingParams);
    return blogs;
  }

  @Get(':blogId/posts')
  async getPostsByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostsPaginatedType> {
    const userId = res.locals.userId;
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };

    const blog = await this.blogsRepo.findBlog(blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const posts = await this.postsQueryRepository.getPosts(userId, pagingParams, blogId);
    return posts;
  }

  @Get(':id')
  async findBlog(@Param('id') id: string): Promise<BlogType> {
    const blog = await this.blogsRepo.findBlog(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }
}
