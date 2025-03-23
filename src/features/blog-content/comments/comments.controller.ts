import { Response } from 'express';
import { Controller, NotFoundException, Param, Res } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { CommentsQueryRepository } from './comments.query-repository.js';
import { CommentViewType } from './comment.types.js';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async findComment(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommentViewType> {
    const userId = res.locals.userId;

    const comment = await this.commentsQueryRepository.findComment(id, userId);
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  // async updateComment(req: Request, res: Response) {
  //   const commentId = req.params.commentId;
  //   const content = req.body.content;
  //   const userId = res.locals.userId;

  //   const result = await this.commentsService.updateComment(commentId, content, userId);
  //   if (result.status !== RESULT_STATUS.NO_CONTENT) {
  //     res.status(httpCodeByResult(result.status)).json(result.extensions);
  //     return;
  //   }

  //   res.status(HTTP_STATUS.NO_CONTENT_204).end();
  // }

  // async deleteComment(req: Request, res: Response) {
  //   const commentId = req.params.commentId;
  //   const userId = res.locals.userId;

  //   const result = await this.commentsService.deleteComment(commentId, userId);
  //   if (result.status !== RESULT_STATUS.NO_CONTENT) {
  //     res.status(httpCodeByResult(result.status)).json(result.extensions);
  //     return;
  //   }

  //   res.status(HTTP_STATUS.NO_CONTENT_204).end();
  // }

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
