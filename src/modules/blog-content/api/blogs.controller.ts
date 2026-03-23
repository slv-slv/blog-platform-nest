import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BlogsPaginatedType, BlogType, GetBlogsQueryParams } from '../types/blogs.types.js';
import { GetPostsQueryParams, PostsPaginatedType } from '../types/posts.types.js';
import { Public } from '../../../common/decorators/public.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { UserId } from '../../../common/decorators/userId.js';
import { QueryBus } from '@nestjs/cqrs';
import { GetBlogsQuery } from '../application/use-cases/get-blogs.use-case.js';
import { GetBlogQuery } from '../application/use-cases/get-blog.use-case.js';
import { GetPostsQuery } from '../application/use-cases/get-posts.use-case.js';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getBlogs(@Query() query: GetBlogsQueryParams): Promise<BlogsPaginatedType> {
    const { searchNameTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return await this.queryBus.execute(new GetBlogsQuery({ searchNameTerm, pagingParams }));
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
    return await this.queryBus.execute(new GetPostsQuery({ pagingParams, userId, blogId }));
  }

  @Get(':id')
  async getBlog(@Param('id') id: string): Promise<BlogType> {
    return await this.queryBus.execute(new GetBlogQuery(id));
  }
}
