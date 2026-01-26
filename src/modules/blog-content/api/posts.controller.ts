import { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from '../application/posts.service.js';
import { PostsQueryRepository } from '../infrastructure/sql/posts.query-repository.js';
import { PostsRepository } from '../infrastructure/sql/posts.repository.js';
import {
  CreatePostForBlogInputDto,
  GetPostsQueryParams,
  PostsPaginatedType,
  PostViewType,
  UpdatePostForBlogInputDto,
} from '../types/posts.types.js';
import {
  CommentsPaginatedType,
  CommentViewType,
  CreateCommentInputDto,
  GetCommentsQueryParams,
} from '../types/comments.types.js';
import { PostLikesService } from '../application/post-likes.service.js';
import { CommentsService } from '../application/comments.service.js';
import { CommentsQueryRepository } from '../infrastructure/sql/comments.query-repository.js';
import { SetLikeStatusDto } from '../types/likes.types.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { PostNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';

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

    if (!post) throw new PostNotFoundDomainException();
    return post;
  }

  @Post()
  @HttpCode(201)
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() body: CreatePostForBlogInputDto): Promise<PostViewType> {
    const { title, shortDescription, content, blogId } = body;
    const newPost = await this.postsService.createPost(title, shortDescription, content, blogId);
    return newPost;
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updatePost(@Param('id') id: string, @Body() body: UpdatePostForBlogInputDto): Promise<void> {
    const { title, shortDescription, content, blogId } = body;
    await this.postsService.updatePost(id, title, shortDescription, content, blogId);
  }

  // @Delete(':id')
  // @HttpCode(204)
  // @UseGuards(BasicAuthGuard)
  // async deletePost(@Param('id') id: string): Promise<void> {
  //   await this.postsService.deletePost(id);
  // }

  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommentsPaginatedType> {
    const userId = res.locals.userId;

    const post = await this.postsRepository.findPost(postId);
    if (!post) throw new PostNotFoundDomainException();

    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };

    const comments = await this.commentsQueryRepository.getComments(postId, userId, pagingParams);
    return comments;
  }

  @Post(':postId/comments')
  @HttpCode(201)
  @UseGuards(AccessTokenGuard)
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
  @UseGuards(AccessTokenGuard)
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
