import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/sql/posts.repository.js';
import { PostLikesRepository } from '../infrastructure/sql/post-likes.repository.js';
import { LikeStatus, SetPostLikeStatusParams } from '../types/likes.types.js';

@Injectable()
export class PostLikesService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}

  async setLikeStatus(params: SetPostLikeStatusParams): Promise<void> {
    const { postId, userId, likeStatus } = params;
    await this.postsRepository.checkPostExists(postId);

    const currentLikeStatus = (await this.postLikesRepository.getLikeStatus([parseInt(postId)], userId))[0]
      .myStatus;
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
}
