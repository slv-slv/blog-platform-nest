import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
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
import { Public } from '../../../common/decorators/public.js';
import { RequestWithOptionalUserId, RequestWithUserId } from '../../../common/types/requests.type.js';

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
  @Public()
  @UseGuards(AccessTokenGuard)
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @Req() req: RequestWithOptionalUserId,
  ): Promise<PostsPaginatedType> {
    const userId = req.userId;

    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };

    return await this.postsQueryRepository.getPosts(pagingParams, userId);
  }

  @Get(':id')
  @Public()
  @UseGuards(AccessTokenGuard)
  async findPost(@Param('id') id: string, @Req() req: RequestWithOptionalUserId): Promise<PostViewType> {
    const userId = req.userId;
    return await this.postsQueryRepository.findPost(id, userId);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() body: CreatePostForBlogInputDto): Promise<PostViewType> {
    const { title, shortDescription, content, blogId } = body;
    return await this.postsService.createPost({ title, shortDescription, content, blogId });
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updatePost(@Param('id') id: string, @Body() body: UpdatePostForBlogInputDto): Promise<void> {
    const { title, shortDescription, content, blogId } = body;
    await this.postsService.updatePost({ postId: id, title, shortDescription, content, blogId });
  }

  // @Delete(':id')
  // @HttpCode(204)
  // @UseGuards(BasicAuthGuard)
  // async deletePost(@Param('id') id: string): Promise<void> {
  //   await this.postsService.deletePost(id);
  // }

  @Get(':postId/comments')
  @Public()
  @UseGuards(AccessTokenGuard)
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @Req() req: RequestWithOptionalUserId,
  ): Promise<CommentsPaginatedType> {
    const userId = req.userId;

    await this.postsRepository.findPost(postId);

    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };

    return await this.commentsQueryRepository.getComments(postId, userId, pagingParams);
  }

  @Post(':postId/comments')
  @HttpCode(201)
  @UseGuards(AccessTokenGuard)
  async createComment(
    @Body() body: CreateCommentInputDto,
    @Param('postId') postId: string,
    @Req() req: RequestWithUserId,
  ): Promise<CommentViewType> {
    const content = body.content;
    const userId = req.userId;

    return await this.commentsService.createComment({ postId, content, userId });
  }

  @Put(':postId/like-status')
  @HttpCode(204)
  @UseGuards(AccessTokenGuard)
  async setLikeStatus(
    @Body() body: SetLikeStatusDto,
    @Param('postId') postId: string,
    @Req() req: RequestWithUserId,
  ) {
    const likeStatus = body.likeStatus;
    const userId = req.userId;

    await this.postLikesService.setLikeStatus({ postId, userId, likeStatus });
  }
}
