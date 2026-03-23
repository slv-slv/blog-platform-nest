import { Body, Controller, Delete, Get, HttpCode, Param, Put, UseGuards } from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/sql/comments.query-repository.js';
import { CommentViewType, UpdateCommentInputDto } from '../types/comments.types.js';
import { SetLikeStatusDto } from '../types/likes.types.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { Public } from '../../../common/decorators/public.js';
import { UserId } from '../../../common/decorators/userId.js';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateCommentCommand } from '../application/use-cases/update-comment.use-case.js';
import { DeleteCommentCommand } from '../application/use-cases/delete-comment.use-case.js';
import { SetCommentLikeStatusCommand } from '../application/use-cases/set-comment-like-status.use-case.js';

@Controller('comments')
@UseGuards(AccessTokenGuard)
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id')
  @Public()
  async getComment(@Param('id') id: string, @UserId() userId: string): Promise<CommentViewType> {
    return await this.commentsQueryRepository.getComment({ commentId: id, userId });
  }

  @Put(':commentId')
  @HttpCode(204)
  async updateComment(
    @Body() body: UpdateCommentInputDto,
    @Param('commentId') commentId: string,
    @UserId() userId: string,
  ): Promise<void> {
    const content = body.content;
    await this.commandBus.execute(new UpdateCommentCommand({ commentId, content, userId }));
  }

  @Delete(':commentId')
  @HttpCode(204)
  async deleteComment(@Param('commentId') commentId: string, @UserId() userId: string) {
    await this.commandBus.execute(new DeleteCommentCommand({ commentId, userId }));
  }

  @Put(':commentId/like-status')
  @HttpCode(204)
  async setLikeStatus(
    @Body() body: SetLikeStatusDto,
    @Param('commentId') commentId: string,
    @UserId() userId: string,
  ) {
    const likeStatus = body.likeStatus;
    await this.commandBus.execute(new SetCommentLikeStatusCommand({ commentId, userId, likeStatus }));
  }
}
