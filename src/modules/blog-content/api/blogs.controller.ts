import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/sql/blogs.query-repository.js';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';
import { BlogsPaginatedType, BlogType, GetBlogsQueryParams } from '../types/blogs.types.js';
import { GetPostsQueryParams, PostsPaginatedType } from '../types/posts.types.js';
import { PostsQueryRepository } from '../infrastructure/sql/posts.query-repository.js';
import { Public } from '../../../common/decorators/public.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { UserId } from '../../../common/decorators/userId.js';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getBlogs(@Query() query: GetBlogsQueryParams): Promise<BlogsPaginatedType> {
    const { searchNameTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return await this.blogsQueryRepository.getAllBlogs(searchNameTerm, pagingParams);
  }

  @Get(':blogId/posts')
  @Public()
  @UseGuards(AccessTokenGuard)
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
    @UserId() userId: string,
  ): Promise<PostsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };
    await this.blogsRepository.checkBlogExists(blogId);
    return await this.postsQueryRepository.getPosts(pagingParams, userId, blogId);
  }

  @Get(':id')
  async findBlog(@Param('id') id: string): Promise<BlogType> {
    return await this.blogsRepository.findBlog(id);
  }
}
