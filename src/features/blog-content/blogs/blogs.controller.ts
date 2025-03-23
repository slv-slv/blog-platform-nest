import {
  Body,
  Controller,
  Delete,
  Get,
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

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsRepo: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
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

  // @Get(':blogId/posts')
  // async getPostsByBlogId(
  //   @Param('blogId') blogId: string,
  //   @Res({ passthrough: true }) res: Response,
  // ): Promise<> {
  //   const pagingParams = res.locals.pagingParams;
  //   const userId = res.locals.userId;

  //   const blog = await this.blogsRepo.findBlog(blogId);
  //   if (!blog) {
  //     throw new NotFoundException('Blog not found');
  //   }

  //   const posts = await this.postsQueryRepository.getPosts(userId, pagingParams, blogId);
  //   return posts;
  // }

  @Get(':id')
  async findBlog(@Param('id') id: string): Promise<BlogType> {
    const blog = await this.blogsRepo.findBlog(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogType> {
    const { name, description, websiteUrl } = body;
    const newBlog = await this.blogsService.createBlog(name, description, websiteUrl);
    return newBlog;
  }

  // @Post(':blogId/posts')
  // async createPostForBlog(@Param('blogId') blogId: string) {
  //   const { title, shortDescription, content } = req.body;

  //   const result = await this.postsService.createPost(title, shortDescription, content, blogId);

  //   if (result.status !== RESULT_STATUS.CREATED) {
  //     res.status(httpCodeByResult(result.status)).json(result.extensions);
  //     return;
  //   }

  //   res.status(HTTP_STATUS.CREATED_201).json(result.data);
  // }

  @Put(':id')
  async updateBlog(@Param('id') id: string, @Body() body: UpdateBlogInputDto) {
    const { name, description, websiteUrl } = body;
    await this.blogsService.updateBlog(id, name, description, websiteUrl);
  }

  @Delete(':id')
  async deleteBlog(@Param('id') id: string) {
    await this.blogsService.deleteBlog(id);
  }
}
