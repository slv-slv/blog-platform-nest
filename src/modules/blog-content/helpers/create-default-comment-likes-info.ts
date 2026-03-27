import { LikesInfoViewModel, LikeStatus } from '../types/likes.types.js';

export function createDefaultCommentLikesInfo(): LikesInfoViewModel {
  return {
    likesCount: 0,
    dislikesCount: 0,
    myStatus: LikeStatus.None,
  };
}
