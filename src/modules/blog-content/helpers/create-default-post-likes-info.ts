import { ExtendedLikesInfoViewType, LikeStatus } from '../types/likes.types.js';

export function createDefaultPostLikesInfo(): ExtendedLikesInfoViewType {
  return {
    likesCount: 0,
    dislikesCount: 0,
    myStatus: LikeStatus.None,
    newestLikes: [],
  };
}
