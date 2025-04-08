import { Response } from 'express';
import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Put, Res } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { CommentsQueryRepository } from './comments.query-repository.js';
import { CommentViewType, UpdateCommentInputDto } from './comments.types.js';
import { CommentLikesService } from '../likes/comments/comment-likes.service.js';
import { LikeStatus, SetLikeStatusDto } from '../likes/types/likes.types.js';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentLikesService: CommentLikesService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id')
  async findComment(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommentViewType> {
    const userId = res.locals.userId;

    const comment = await this.commentsQueryRepository.findComment(id, userId);
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  @Put(':commentId')
  @HttpCode(204)
  async updateComment(
    @Body() body: UpdateCommentInputDto,
    @Param('commentId') commentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const content = body.content;
    const userId = res.locals.userId;

    await this.commentsService.updateComment(commentId, content, userId);
  }

  @Delete(':commentId')
  @HttpCode(204)
  async deleteComment(@Param('commentId') commentId: string, @Res({ passthrough: true }) res: Response) {
    const userId = res.locals.userId;

    await this.commentsService.deleteComment(commentId, userId);
  }

  @Put(':commentId/like-status')
  @HttpCode(204)
  async setLikeStatus(
    @Body() body: SetLikeStatusDto,
    @Param('commentId') commentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const likeStatus = body.likeStatus;
    const userId = res.locals.userId;

    await this.commentLikesService.setLikeStatus(commentId, userId, likeStatus);
  }
}
