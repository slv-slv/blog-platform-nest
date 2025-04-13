import { Injectable, NotFoundException } from '@nestjs/common';
import { ExtendedLikesInfoViewType, LikeStatus } from '../types/likes.types.js';
import { PostsRepository } from '../../posts/posts.repository.js';
import { PostLikesRepository } from './post-likes.repository.js';
import { PostLikesType } from './post-likes.types.js';

@Injectable()
export class PostLikesService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}
  async setLikeStatus(postId: string, userId: string, likeStatus: LikeStatus): Promise<void> {
    const post = await this.postsRepository.findPost(postId);
    if (!post) throw new NotFoundException('Post not found');

    const currentLikeStatus = await this.postLikesRepository.getLikeStatus(postId, userId);
    if (likeStatus === currentLikeStatus) return;

    const createdAt = new Date();

    switch (likeStatus) {
      case LikeStatus.None:
        await this.postLikesRepository.setNone(postId, userId);
        break;
      case LikeStatus.Like:
        await this.postLikesRepository.setLike(postId, userId, createdAt);
        break;
      case LikeStatus.Dislike:
        await this.postLikesRepository.setDislike(postId, userId, createdAt);
        break;
    }
  }

  async createLikesInfo(postId: string): Promise<void> {
    const likesInfo: PostLikesType = {
      postId,
      likes: [],
      dislikes: [],
    };

    await this.postLikesRepository.createLikesInfo(likesInfo);
  }

  async deleteLikesInfo(postId: string): Promise<void> {
    await this.postLikesRepository.deleteLikesInfo(postId);
  }

  getDefaultLikesInfo(): ExtendedLikesInfoViewType {
    return {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [],
    };
  }
}
