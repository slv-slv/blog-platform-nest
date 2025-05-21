import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository } from '../../../comments/infrastructure/mongoose/comments.repository.js';
import { CommentLikesRepository } from '../infrastructure/mongoose/comment-likes.repository.js';
import { LikesInfoViewType, LikeStatus } from '../../types/likes.types.js';
import { CommentLikesType } from '../comment-likes.types.js';

@Injectable()
export class CommentLikesService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commentLikesRepository: CommentLikesRepository,
  ) {}

  async setLikeStatus(commentId: string, userId: string, likeStatus: LikeStatus): Promise<void> {
    const comment = await this.commentsRepository.findComment(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const currentLikeStatus = await this.commentLikesRepository.getLikeStatus(commentId, userId);
    if (likeStatus === currentLikeStatus) return;

    const createdAt = new Date();

    switch (likeStatus) {
      case LikeStatus.None:
        await this.commentLikesRepository.setNone(commentId, userId);
        break;
      case LikeStatus.Like:
        await this.commentLikesRepository.setLike(commentId, userId, createdAt);
        break;
      case LikeStatus.Dislike:
        await this.commentLikesRepository.setDislike(commentId, userId, createdAt);
        break;
    }
  }

  // async createEmptyLikesInfo(commentId: string): Promise<void> {
  //   await this.commentLikesRepository.createEmptyLikesInfo(commentId);
  // }

  // async deleteLikesInfo(commentId: string): Promise<void> {
  //   await this.commentLikesRepository.deleteLikesInfo(commentId);
  // }

  getDefaultLikesInfo(): LikesInfoViewType {
    return {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
    };
  }
}
