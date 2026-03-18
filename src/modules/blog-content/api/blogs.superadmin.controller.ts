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
import { BlogsService } from '../application/blogs.service.js';
import {
  CreatePostInputDto,
  GetPostsQueryParams,
  PostsPaginatedType,
  PostViewType,
  UpdatePostInputDto,
} from '../types/posts.types.js';
import { PostsQueryRepository } from '../infrastructure/sql/posts.query-repository.js';
import { PostsService } from '../application/posts.service.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';

@Controller('sa/blogs')
@UseGuards(BasicAuthGuard)
export class BlogsSuperadminController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsRepository: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllBlogs(@Query() query: GetBlogsQueryParams): Promise<BlogsPaginatedType> {
    const { searchNameTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return await this.blogsQueryRepository.getAllBlogs(searchNameTerm, pagingParams);
  }

  @Get(':id')
  async findBlog(@Param('id') id: string): Promise<BlogType> {
    return await this.blogsRepository.findBlog(id);
  }

  @Post()
  @HttpCode(201)
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogType> {
    const { name, description, websiteUrl } = body;
    return await this.blogsService.createBlog({ name, description, websiteUrl });
  }

  @Put(':id')
  @HttpCode(204)
  async updateBlog(@Param('id') id: string, @Body() body: UpdateBlogInputDto) {
    const { name, description, websiteUrl } = body;
    await this.blogsService.updateBlog({ id, name, description, websiteUrl });
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBlog(@Param('id') id: string) {
    await this.blogsService.deleteBlog(id);
  }

  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PostsPaginatedType> {
    const userId = null;
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };
    await this.blogsRepository.findBlog(blogId);
    return await this.postsQueryRepository.getPosts(pagingParams, userId, blogId);
  }

  @Post(':blogId/posts')
  @HttpCode(201)
  async createPost(@Param('blogId') blogId: string, @Body() body: CreatePostInputDto): Promise<PostViewType> {
    const { title, shortDescription, content } = body;
    return await this.postsService.createPost({ title, shortDescription, content, blogId });
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(204)
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<void> {
    const { title, shortDescription, content } = body;
    await this.postsService.updatePost({ postId, title, shortDescription, content, blogId });
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(204)
  async deletePost(@Param('blogId') blogId: string, @Param('postId') postId: string): Promise<void> {
    await this.postsService.deletePost({ blogId, postId });
  }
}
