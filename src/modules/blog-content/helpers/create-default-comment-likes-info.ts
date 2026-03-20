import { LikesInfoViewType, LikeStatus } from '../types/likes.types.js';

export function createDefaultCommentLikesInfo(): LikesInfoViewType {
  return {
    likesCount: 0,
    dislikesCount: 0,
    myStatus: LikeStatus.None,
  };
}
