import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/sql/blogs.query-repository.js';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';
import {
  BlogsPaginatedType,
  BlogType,
  CreateBlogInputDto,
  GetBlogsQueryParams,
  UpdateBlogInputDto,
} from '../types/blogs.types.js';
import {
  CreatePostInputDto,
  GetPostsQueryParams,
  PostsPaginatedType,
  PostViewType,
  UpdatePostInputDto,
} from '../types/posts.types.js';
import { PostsQueryRepository } from '../infrastructure/sql/posts.query-repository.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/usecases/create-blog.use-case.js';
import { UpdateBlogCommand } from '../application/usecases/update-blog.use-case.js';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.use-case.js';
import { CreatePostCommand } from '../application/usecases/create-post.use-case.js';
import { UpdatePostCommand } from '../application/usecases/update-post.use-case.js';
import { DeletePostCommand } from '../application/usecases/delete-post.use-case.js';
import { GetBlogsQuery } from '../application/usecases/get-blogs.use-case.js';

@Controller('sa/blogs')
@UseGuards(BasicAuthGuard)
export class BlogsSuperadminController {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getBlogs(@Query() query: GetBlogsQueryParams): Promise<BlogsPaginatedType> {
    const { searchNameTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return await this.queryBus.execute(new GetBlogsQuery({ searchNameTerm, pagingParams }));
  }

  @Get(':id')
  async getBlog(@Param('id') id: string): Promise<BlogType> {
    return await this.blogsRepository.getBlog(id);
  }

  @Post()
  @HttpCode(201)
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogType> {
    const { name, description, websiteUrl } = body;
    return await this.commandBus.execute(new CreateBlogCommand({ name, description, websiteUrl }));
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
    @Query() query: GetPostsQueryParams,
  ): Promise<PostsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };
    await this.blogsRepository.checkBlogExists(blogId);
    return await this.postsQueryRepository.getPosts({ pagingParams, blogId });
  }

  @Post(':blogId/posts')
  @HttpCode(201)
  async createPost(@Param('blogId') blogId: string, @Body() body: CreatePostInputDto): Promise<PostViewType> {
    const { title, shortDescription, content } = body;
    return await this.commandBus.execute(new CreatePostCommand({ title, shortDescription, content, blogId }));
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
