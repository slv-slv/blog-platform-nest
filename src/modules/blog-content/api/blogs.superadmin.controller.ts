import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  BlogsPaginatedViewModel,
  BlogViewModel,
  CreateBlogInputDto,
  GetBlogsQueryDto,
  UpdateBlogInputDto,
} from '../types/blogs.types.js';
import {
  CreatePostInputDto,
  GetPostsQueryDto,
  PostsPaginatedViewModel,
  PostViewModel,
  UpdatePostInputDto,
} from '../types/posts.types.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case.js';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case.js';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case.js';
import { CreatePostCommand } from '../application/use-cases/create-post.use-case.js';
import { UpdatePostCommand } from '../application/use-cases/update-post.use-case.js';
import { DeletePostCommand } from '../application/use-cases/delete-post.use-case.js';
import { GetBlogsQuery } from '../application/use-cases/get-blogs.use-case.js';
import { GetBlogQuery } from '../application/use-cases/get-blog.use-case.js';
import { GetPostsQuery } from '../application/use-cases/get-posts.use-case.js';

@Controller('sa/blogs')
@UseGuards(BasicAuthGuard)
export class BlogsSuperadminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getBlogs(@Query() query: GetBlogsQueryDto): Promise<BlogsPaginatedViewModel> {
    const { searchNameTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return this.queryBus.execute(new GetBlogsQuery({ searchNameTerm, pagingParams }));
  }

  @Get(':id')
  async getBlog(@Param('id') id: string): Promise<BlogViewModel> {
    return this.queryBus.execute(new GetBlogQuery(id));
  }

  @Post()
  @HttpCode(201)
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewModel> {
    const { name, description, websiteUrl } = body;
    return this.commandBus.execute(new CreateBlogCommand({ name, description, websiteUrl }));
  }

  @Put(':id')
  @HttpCode(204)
  async updateBlog(@Param('id') id: string, @Body() body: UpdateBlogInputDto): Promise<void> {
    const { name, description, websiteUrl } = body;
    await this.commandBus.execute(new UpdateBlogCommand({ id, name, description, websiteUrl }));
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(id));
  }

  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryDto,
  ): Promise<PostsPaginatedViewModel> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };
    return this.queryBus.execute(new GetPostsQuery({ pagingParams, blogId }));
  }

  @Post(':blogId/posts')
  @HttpCode(201)
  async createPost(
    @Param('blogId') blogId: string,
    @Body() body: CreatePostInputDto,
  ): Promise<PostViewModel> {
    const { title, shortDescription, content } = body;
    return this.commandBus.execute(new CreatePostCommand({ title, shortDescription, content, blogId }));
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(204)
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<void> {
    const { title, shortDescription, content } = body;
    await this.commandBus.execute(
      new UpdatePostCommand({ postId, title, shortDescription, content, blogId }),
    );
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(204)
  async deletePost(@Param('blogId') blogId: string, @Param('postId') postId: string): Promise<void> {
    await this.commandBus.execute(new DeletePostCommand({ blogId, postId }));
  }
}
