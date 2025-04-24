import { Injectable } from '@nestjs/common';
import { ExtendedLikesInfoViewType } from '../types/likes.types.js';
import { PostLikesRepository } from './post-likes.repository.js';
import { SETTINGS } from '../../../../settings.js';
import { InjectModel } from '@nestjs/mongoose';
import { PostLikes } from './post-likes.schemas.js';
import { PostLikesType } from './post-likes.types.js';
import { Model } from 'mongoose';
import { UsersQueryRepository } from '../../../user-accounts/users/users.query-repository.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @InjectModel(PostLikes.name) private readonly model: Model<PostLikesType>,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  async getLikesInfo(postId: string, userId: string): Promise<ExtendedLikesInfoViewType> {
    const likesCount = await this.postLikesRepository.getLikesCount(postId);
    const dislikesCount = await this.postLikesRepository.getDislikesCount(postId);
    const myStatus = await this.postLikesRepository.getLikeStatus(postId, userId);

    const newestLikesNumber = SETTINGS.NEWEST_LIKES_NUMBER;

    const result = await this.model.aggregate([
      { $match: { postId } },
      { $unwind: '$likes' },
      { $sort: { 'likes.createdAt': -1 } },
      { $limit: newestLikesNumber },
      {
        $group: {
          _id: '$_id',
          likes: { $push: '$likes' },
        },
      },
      {
        $project: {
          _id: 0,
          likes: 1,
        },
      },
    ]);

    const post = result[0];

    const newestLikes = post
      ? await Promise.all(
          post.likes.map(async (like: { userId: string; createdAt: Date }) => {
            const addedAt = like.createdAt.toISOString();
            const userId = like.userId;

            const user = await this.usersQueryRepository.getCurrentUser(userId);
            const login = user?.login;

            return { addedAt, userId, login };
          }),
        )
      : [];

    return { likesCount, dislikesCount, myStatus, newestLikes };
  }
}
