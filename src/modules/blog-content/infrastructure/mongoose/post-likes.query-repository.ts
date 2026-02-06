import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PostLikesRepository } from './post-likes.repository.js';
import { InjectModel } from '@nestjs/mongoose';
import { PostLikes } from './post-likes.schemas.js';
import { PostLikesType } from '../../types/post-likes.types.js';
import { Model } from 'mongoose';
import { ExtendedLikesInfoViewType } from '../../types/likes.types.js';
import { UsersQueryRepository } from '../../../user-accounts/infrastructure/mongoose/users.query-repository.js';
import { coreConfig } from '../../../../config/core.config.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @InjectModel(PostLikes.name) private readonly model: Model<PostLikesType>,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
  ) {}
  async getLikesInfo(postId: string, userId: string): Promise<ExtendedLikesInfoViewType> {
    const likesCount = await this.postLikesRepository.getLikesCount(postId);
    const dislikesCount = await this.postLikesRepository.getDislikesCount(postId);
    const myStatus = await this.postLikesRepository.getLikeStatus(postId, userId);

    const newestLikesNumber = this.core.newestLikesNumber;

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
