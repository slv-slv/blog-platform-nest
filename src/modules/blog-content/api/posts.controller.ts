import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  CreatePostForBlogInputDto,
  GetPostsQueryDto,
  PostsPaginatedViewModel,
  PostViewModel,
  UpdatePostForBlogInputDto,
} from '../types/posts.types.js';
import {
  CommentsPaginatedViewModel,
  CommentViewModel,
  CreateCommentInputDto,
  GetCommentsQueryDto,
} from '../types/comments.types.js';
import { SetLikeStatusDto } from '../types/likes.types.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { Public } from '../../../common/decorators/public.js';
import { UserId } from '../../../common/decorators/userId.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/use-cases/create-post.use-case.js';
import { UpdatePostCommand } from '../application/use-cases/update-post.use-case.js';
import { CreateCommentCommand } from '../application/use-cases/create-comment.use-case.js';
import { SetPostLikeStatusCommand } from '../application/use-cases/set-post-like-status.use-case.js';
import { GetPostQuery } from '../application/use-cases/get-post.use-case.js';
import { GetPostsQuery } from '../application/use-cases/get-posts.use-case.js';
import { GetCommentsQuery } from '../application/use-cases/get-comments.use-case.js';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Public()
  @UseGuards(AccessTokenGuard)
  async getPosts(
    @Query() query: GetPostsQueryDto,
    @UserId() userId: string,
  ): Promise<PostsPaginatedViewModel> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortDirection, pageNumber, pageSize, sortBy };
    return await this.queryBus.execute(new GetPostsQuery({ pagingParams, userId }));
  }

  @Get(':id')
  @Public()
  @UseGuards(AccessTokenGuard)
  async getPost(@Param('id') id: string, @UserId() userId: string): Promise<PostViewModel> {
    return await this.queryBus.execute(new GetPostQuery({ postId: id, userId }));
  }

  @Post()
  @HttpCode(201)
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() body: CreatePostForBlogInputDto): Promise<PostViewModel> {
    const { title, shortDescription, content, blogId } = body;
    return await this.commandBus.execute(new CreatePostCommand({ title, shortDescription, content, blogId }));
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updatePost(@Param('id') postId: string, @Body() body: UpdatePostForBlogInputDto): Promise<void> {
    const { title, shortDescription, content, blogId } = body;
    await this.commandBus.execute(
      new UpdatePostCommand({ postId, title, shortDescription, content, blogId }),
    );
  }

  @Get(':postId/comments')
  @Public()
  @UseGuards(AccessTokenGuard)
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryDto,
    @UserId() userId: string,
  ): Promise<CommentsPaginatedViewModel> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return await this.queryBus.execute(new GetCommentsQuery({ postId, userId, pagingParams }));
  }

  @Post(':postId/comments')
  @HttpCode(201)
  @UseGuards(AccessTokenGuard)
  async createComment(
    @Body() body: CreateCommentInputDto,
    @Param('postId') postId: string,
    @UserId() userId: string,
  ): Promise<CommentViewModel> {
    const content = body.content;
    return await this.commandBus.execute(new CreateCommentCommand({ postId, content, userId }));
  }

  @Put(':postId/like-status')
  @HttpCode(204)
  @UseGuards(AccessTokenGuard)
  async setLikeStatus(
    @Body() body: SetLikeStatusDto,
    @Param('postId') postId: string,
    @UserId() userId: string,
  ): Promise<void> {
    const likeStatus = body.likeStatus;
    await this.commandBus.execute(new SetPostLikeStatusCommand({ postId, userId, likeStatus }));
  }
}
