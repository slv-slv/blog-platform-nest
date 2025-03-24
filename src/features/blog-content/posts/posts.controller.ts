import { Response } from 'express';
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
  Res,
} from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { PostsQueryRepository } from './posts.query-repository.js';
import { PostsRepository } from './posts.repository.js';
import { CreatePostInputDto, PostsPaginatedType, PostViewType, UpdatePostInputDto } from './posts.types.js';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllPosts(@Res({ passthrough: true }) res: Response): Promise<PostsPaginatedType> {
    const pagingParams = res.locals.pagingParams;
    const userId = res.locals.userId;

    const posts = await this.postsQueryRepository.getPosts(userId, pagingParams);
    return posts;
  }

  @Get(':id')
  async findPost(@Param('id') id: string, @Res({ passthrough: true }) res: Response): Promise<PostViewType> {
    const userId = res.locals.userId;

    const post = await this.postsQueryRepository.findPost(id, userId);

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Post()
  @HttpCode(201)
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewType> {
    const { title, shortDescription, content, blogId } = body;
    const newPost = await this.postsService.createPost(title, shortDescription, content, blogId);
    // Проверка существования блога в кастомном методе валидатора
    return newPost;
  }

  @Put(':id')
  @HttpCode(204)
  async updatePost(@Param(':id') id: string, @Body() body: UpdatePostInputDto) {
    const { title, shortDescription, content, blogId } = body;
    await this.postsService.updatePost(id, title, shortDescription, content, blogId);
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePost(@Param(':id') id: string) {
    await this.postsService.deletePost(id);
  }

  // async getCommentsForPost(req: Request, res: Response) {
  //   const postId = req.params.postId;
  //   const userId = res.locals.userId;

  //   const post = await this.postsRepository.findPost(postId);
  //   if (!post) {
  //     res.status(HTTP_STATUS.NOT_FOUND_404).json({ error: 'Post not found' });
  //     return;
  //   }
  //   const pagingParams = res.locals.pagingParams;
  //   const comments = await this.commentsQueryRepo.getCommentsForPost(postId, userId, pagingParams);
  //   res.status(HTTP_STATUS.OK_200).json(comments);
  // }

  // async createComment(req: Request, res: Response) {
  //   const postId = req.params.postId;
  //   const content = req.body.content;
  //   const userId = res.locals.userId;

  //   const result = await this.commentsService.createComment(postId, content, userId);
  //   if (result.status !== RESULT_STATUS.CREATED) {
  //     res.status(httpCodeByResult(result.status)).json(result.extensions);
  //     return;
  //   }

  //   res.status(HTTP_STATUS.CREATED_201).json(result.data);
  // }

  // async setLikeStatus(req: Request, res: Response) {
  //   const postId = req.params.postId;
  //   const userId = res.locals.userId;
  //   const likeStatus = req.body.likeStatus;

  //   const result = await this.postLikesService.setLikeStatus(postId, userId, likeStatus);

  //   if (result.status !== RESULT_STATUS.NO_CONTENT) {
  //     res.status(httpCodeByResult(result.status)).json(result.extensions);
  //   }

  //   res.status(HTTP_STATUS.NO_CONTENT_204).end();
  // }
}
