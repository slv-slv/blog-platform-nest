import { Response } from 'express';
import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Put, Res } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { CommentsQueryRepository } from './comments.query-repository.js';
import { CommentViewType, UpdateCommentInputDto } from './comments.types.js';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
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

  // async setLikeStatus(req: Request, res: Response) {
  //   const commentId = req.params.commentId;
  //   const userId = res.locals.userId;
  //   const likeStatus = req.body.likeStatus;

  //   const result = await this.commentLikesService.setLikeStatus(commentId, userId, likeStatus);

  //   if (result.status !== RESULT_STATUS.NO_CONTENT) {
  //     res.status(httpCodeByResult(result.status)).json(result.extensions);
  //   }

  //   res.status(HTTP_STATUS.NO_CONTENT_204).end();
  // }
}
