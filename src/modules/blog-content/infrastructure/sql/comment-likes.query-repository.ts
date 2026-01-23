import { Injectable } from '@nestjs/common';
import { CommentLikesRepository } from './comment-likes.repository.js';
import { LikesInfoViewType } from '../../types/likes.types.js';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(private readonly commentLikesRepository: CommentLikesRepository) {}
  async getLikesInfo(commentId: string, userId: string | null): Promise<LikesInfoViewType> {
    const likesCount = await this.commentLikesRepository.getLikesCount(commentId);
    const dislikesCount = await this.commentLikesRepository.getDislikesCount(commentId);
    const myStatus = await this.commentLikesRepository.getLikeStatus(commentId, userId);

    return { likesCount, dislikesCount, myStatus };
  }
}
