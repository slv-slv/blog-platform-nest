import { Injectable } from '@nestjs/common';
import { CommentLikesRepository } from './comment-likes.repository.js';
import { LikeStatus, LikesInfoViewType } from '../../types/likes.types.js';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(private readonly commentLikesRepository: CommentLikesRepository) {}

  async getLikesInfo(commentIdArr: number[], userId: string | null): Promise<Map<number, LikesInfoViewType>> {
    const likesCountArr = await this.commentLikesRepository.getLikesCount(commentIdArr);
    const likesCountMap = new Map(
      likesCountArr.map(({ commentId, likesCount }) => [commentId, likesCount]),
    );

    const dislikesCountArr = await this.commentLikesRepository.getDislikesCount(commentIdArr);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ commentId, dislikesCount }) => [commentId, dislikesCount]),
    );

    const myStatusArr = await this.commentLikesRepository.getLikeStatus(commentIdArr, userId);
    const myStatusMap = new Map(myStatusArr.map(({ commentId, myStatus }) => [commentId, myStatus]));

    const likesInfoMap = new Map<number, LikesInfoViewType>();
    for (const commentId of commentIdArr) {
      likesInfoMap.set(commentId, {
        likesCount: likesCountMap.get(commentId) ?? 0,
        dislikesCount: dislikesCountMap.get(commentId) ?? 0,
        myStatus: myStatusMap.get(commentId) ?? LikeStatus.None,
      });
    }

    return likesInfoMap;
  }
}
