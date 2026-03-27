import { ExtendedLikesInfoViewModel, LikeStatus } from '../types/likes.types.js';

export function createDefaultPostLikesInfo(): ExtendedLikesInfoViewModel {
  return {
    likesCount: 0,
    dislikesCount: 0,
    myStatus: LikeStatus.None,
    newestLikes: [],
  };
}
