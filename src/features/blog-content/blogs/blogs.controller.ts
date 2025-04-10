import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BlogsQueryRepository } from './blogs.query-repository.js';
import { BlogsRepository } from './blogs.repository.js';
import { BasicPagingParams } from '../../../common/types/paging-params.types.js';
import {
  BlogsPaginatedType,
  BlogType,
  CreateBlogInputDto,
  GetBlogsQueryParams,
  UpdateBlogInputDto,
} from './blogs.types.js';
import { BlogsService } from './blogs.service.js';
import {
  CreatePostInputDto,
  GetPostsQueryParams,
  PostsPaginatedType,
  PostViewType,
} from '../posts/posts.types.js';
import { PostsService } from '../posts/posts.service.js';
import { PostsQueryRepository } from '../posts/posts.query-repository.js';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsRepo: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsService: PostsService,
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

  @Post()
  @HttpCode(201)
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogType> {
    const { name, description, websiteUrl } = body;
    const newBlog = await this.blogsService.createBlog(name, description, websiteUrl);
    return newBlog;
  }

  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() body: CreatePostInputDto,
  ): Promise<PostViewType> {
    const { title, shortDescription, content } = body;
    const newPost = await this.postsService.createPost(title, shortDescription, content, blogId);
    return newPost;
  }

  @Put(':id')
  @HttpCode(204)
  async updateBlog(@Param('id') id: string, @Body() body: UpdateBlogInputDto) {
    const { name, description, websiteUrl } = body;
    await this.blogsService.updateBlog(id, name, description, websiteUrl);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBlog(@Param('id') id: string) {
    await this.blogsService.deleteBlog(id);
  }
}
