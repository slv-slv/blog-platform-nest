import { Injectable } from '@nestjs/common';
import { CommentsRepository } from '../infrastructure/sql/comments.repository.js';
import { CommentLikesRepository } from '../infrastructure/sql/comment-likes.repository.js';
import { LikesInfoViewType, LikeStatus, SetCommentLikeStatusParams } from '../types/likes.types.js';

@Injectable()
export class CommentLikesService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commentLikesRepository: CommentLikesRepository,
  ) {}

  async setLikeStatus(params: SetCommentLikeStatusParams): Promise<void> {
    const { commentId, userId, likeStatus } = params;
    await this.commentsRepository.findComment(commentId);

    const currentLikeStatus = (
      await this.commentLikesRepository.getLikeStatus([parseInt(commentId)], userId)
    )[0].myStatus;
    if (likeStatus === currentLikeStatus) return;

    const createdAt = new Date();

    switch (likeStatus) {
      case LikeStatus.None:
        await this.commentLikesRepository.setNone({ commentId, userId });
        break;
      case LikeStatus.Like:
        await this.commentLikesRepository.setLike({ commentId, userId, createdAt });
        break;
      case LikeStatus.Dislike:
        await this.commentLikesRepository.setDislike({ commentId, userId, createdAt });
        break;
    }
  }

  // async createEmptyLikesInfo(commentId: string): Promise<void> {
  //   await this.commentLikesRepository.createEmptyLikesInfo(commentId);
  // }

  // async deleteLikesInfo(commentId: string): Promise<void> {
  //   await this.commentLikesRepository.deleteLikesInfo(commentId);
  // }
}
