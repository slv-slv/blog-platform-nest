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
import { PagingParamsType } from '../../../common/types/paging-params.types.js';
import { BlogsPaginatedType, BlogType, CreateBlogInputDto, UpdateBlogInputDto } from './blogs.types.js';
import { BlogsService } from './blogs.service.js';
import { CreatePostInputDto, PostsPaginatedType, PostViewType } from '../posts/posts.types.js';
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
  async getAllBlogs(
    @Res({ passthrough: true }) res: Response,
    @Query('searchNameTerm') searchNameTerm: string | null = null,
  ): Promise<BlogsPaginatedType> {
    const pagingParams = res.locals.pagingParams as PagingParamsType;

    const blogs = await this.blogsQueryRepository.getAllBlogs(searchNameTerm, pagingParams);
    return blogs;
  }

  @Get(':blogId/posts')
  async getPostsByBlogId(
    @Param('blogId') blogId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostsPaginatedType> {
    const pagingParams = res.locals.pagingParams;
    const userId = res.locals.userId;

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
