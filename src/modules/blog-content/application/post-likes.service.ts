import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/sql/posts.repository.js';
import { PostLikesRepository } from '../infrastructure/sql/post-likes.repository.js';
import { ExtendedLikesInfoViewType, LikeStatus, SetPostLikeStatusParams } from '../types/likes.types.js';
import { PostLikeStatusRepoParams } from '../types/post-likes.types.js';

@Injectable()
export class PostLikesService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}

  async setLikeStatus(params: SetPostLikeStatusParams): Promise<void> {
    const { postId, userId, likeStatus } = params;
    await this.postsRepository.findPost(postId);

    const likeStatusParams: PostLikeStatusRepoParams = { postId, userId };
    const currentLikeStatus = await this.postLikesRepository.getLikeStatus(likeStatusParams);
    if (likeStatus === currentLikeStatus) return;

    const createdAt = new Date();

    switch (likeStatus) {
      case LikeStatus.None:
        await this.postLikesRepository.setNone({ postId, userId });
        break;
      case LikeStatus.Like:
        await this.postLikesRepository.setLike({ postId, userId, createdAt });
        break;
      case LikeStatus.Dislike:
        await this.postLikesRepository.setDislike({ postId, userId, createdAt });
        break;
    }
  }

  // async createEmptyLikesInfo(postId: string): Promise<void> {
  //   await this.postLikesRepository.createEmptyLikesInfo(postId);
  // }

  // async deleteLikesInfo(postId: string): Promise<void> {
  //   await this.postLikesRepository.deleteLikesInfo(postId);
  // }

  getDefaultLikesInfo(): ExtendedLikesInfoViewType {
    return {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [],
    };
  }
}
