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
  Query,
  Res,
} from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { PostsQueryRepository } from './posts.query-repository.js';
import { PostsRepository } from './posts.repository.js';
import {
  CreatePostInputDto,
  GetPostsQueryParams,
  PostsPaginatedType,
  PostViewType,
  UpdatePostInputDto,
} from './posts.types.js';
import {
  CommentsPaginatedType,
  CommentViewType,
  CreateCommentInputDto,
  GetCommentsQueryParams,
} from '../comments/comments.types.js';
import { CommentsQueryRepository } from '../comments/comments.query-repository.js';
import { CommentsService } from '../comments/comments.service.js';
import { LikeStatus, SetLikeStatusDto } from '../likes/types/likes.types.js';
import { PostLikesService } from '../likes/posts/post-likes.service.js';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postLikesService: PostLikesService,
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get()
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostsPaginatedType> {
    const userId = res.locals.userId;

    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };

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
  async updatePost(@Param('id') id: string, @Body() body: UpdatePostInputDto): Promise<void> {
    const { title, shortDescription, content, blogId } = body;
    await this.postsService.updatePost(id, title, shortDescription, content, blogId);
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.postsService.deletePost(id);
  }

  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommentsPaginatedType> {
    const userId = res.locals.userId;

    const post = await this.postsRepository.findPost(postId);
    if (!post) throw new NotFoundException('Post not found');

    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };

    const comments = await this.commentsQueryRepository.getCommentsForPost(postId, userId, pagingParams);
    return comments;
  }

  @Post(':postId/comments')
  @HttpCode(204)
  async createComment(
    @Body() body: CreateCommentInputDto,
    @Param('postId') postId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommentViewType> {
    const content = body.content;
    const userId = res.locals.userId;

    const newComment = await this.commentsService.createComment(postId, content, userId);
    return newComment;
  }

  @Put(':postId/like-status')
  @HttpCode(204)
  async setLikeStatus(
    @Body() body: SetLikeStatusDto,
    @Param('postId') postId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const likeStatus = body.likeStatus;
    const userId = res.locals.userId;

    await this.postLikesService.setLikeStatus(postId, userId, likeStatus);
  }
}
