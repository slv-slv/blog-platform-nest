import { Body, Controller, Delete, Get, HttpCode, Param, Put, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from '../application/comments.service.js';
import { CommentsQueryRepository } from '../infrastructure/sql/comments.query-repository.js';
import { CommentViewType, UpdateCommentInputDto } from '../types/comments.types.js';
import { CommentLikesService } from '../application/comment-likes.service.js';

import { SetLikeStatusDto } from '../types/likes.types.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { Public } from '../../../common/decorators/public.js';
import { UserId } from '../../../common/decorators/userId.js';

@Controller('comments')
@UseGuards(AccessTokenGuard)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentLikesService: CommentLikesService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id')
  @Public()
  async findComment(@Param('id') id: string, @UserId() userId: string): Promise<CommentViewType> {
    return await this.commentsQueryRepository.findComment(id, userId);
  }

  @Put(':commentId')
  @HttpCode(204)
  async updateComment(
    @Body() body: UpdateCommentInputDto,
    @Param('commentId') commentId: string,
    @UserId() userId: string,
  ): Promise<void> {
    const content = body.content;
    await this.commentsService.updateComment({ commentId, content, userId });
  }

  @Delete(':commentId')
  @HttpCode(204)
  async deleteComment(@Param('commentId') commentId: string, @UserId() userId: string) {
    await this.commentsService.deleteComment({ commentId, userId });
  }

  @Put(':commentId/like-status')
  @HttpCode(204)
  async setLikeStatus(
    @Body() body: SetLikeStatusDto,
    @Param('commentId') commentId: string,
    @UserId() userId: string,
  ) {
    const likeStatus = body.likeStatus;
    await this.commentLikesService.setLikeStatus({ commentId, userId, likeStatus });
  }
}
