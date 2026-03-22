import { Injectable } from '@nestjs/common';
import { CommentLikesRepository } from './comment-likes.repository.js';
import { GetSingleCommentLikesInfoParams, LikesInfoViewType } from '../../types/likes.types.js';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(private readonly commentLikesRepository: CommentLikesRepository) {}
  async getLikesInfo(params: GetSingleCommentLikesInfoParams): Promise<LikesInfoViewType> {
    const { commentId } = params;
    const userId = params.userId ?? null;
    const likesCount = await this.commentLikesRepository.getLikesCount(commentId);
    const dislikesCount = await this.commentLikesRepository.getDislikesCount(commentId);
    const myStatus = await this.commentLikesRepository.getLikeStatus({ commentId, userId });

    return { likesCount, dislikesCount, myStatus };
  }
}
