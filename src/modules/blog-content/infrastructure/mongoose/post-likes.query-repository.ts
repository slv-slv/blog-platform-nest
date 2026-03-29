import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ExtendedLikesInfoViewModel, GetPostLikesInfoParams, LikeStatus } from '../../types/likes.types.js';
import { UsersQueryRepository } from '../../../user-accounts/infrastructure/mongoose/users.query-repository.js';
import { PostLikes } from './post-likes.schemas.js';
import { Model } from 'mongoose';
import { PostLikesModel } from '../../types/post-likes.types.js';
import { ConfigType } from '@nestjs/config';
import { coreConfig } from '../../../../config/core.config.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @InjectModel(PostLikes.name) private readonly model: Model<PostLikesModel>,
    private readonly usersQueryRepository: UsersQueryRepository,
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
  ) {}

  async getLikesInfo(
    params: GetPostLikesInfoParams<string>,
  ): Promise<Map<string, ExtendedLikesInfoViewModel>> {
    const { postIds, userId = null } = params;
    const likesCountArr = await this.getLikesCount(postIds);
    const likesCountMap = new Map(likesCountArr.map(({ postId, likesCount }) => [postId, likesCount]));

    const dislikesCountArr = await this.getDislikesCount(postIds);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ postId, dislikesCount }) => [postId, dislikesCount]),
    );

    const myStatusArr = await this.getLikeStatus(postIds, userId);
    const myStatusMap = new Map(myStatusArr.map(({ postId, myStatus }) => [postId, myStatus]));

    const newestLikesArr = await this.getNewestLikes(postIds);
    const userIds = [...new Set(newestLikesArr.map((row) => row.userId))];
    const userLoginMap = await this.usersQueryRepository.getUserLoginsMap(userIds);

    const newestLikesMap = new Map<string, { addedAt: string; userId: string; login: string }[]>();
    for (const row of newestLikesArr) {
      const likes = newestLikesMap.get(row.postId) ?? [];
      const login = userLoginMap.get(row.userId);

      if (!login) {
        continue;
      }

      likes.push({ addedAt: row.addedAt.toISOString(), userId: row.userId, login });
      newestLikesMap.set(row.postId, likes);
    }

    const likesInfoMap = new Map<string, ExtendedLikesInfoViewModel>();
    for (const postId of postIds) {
      likesInfoMap.set(postId, {
        likesCount: likesCountMap.get(postId) ?? 0,
        dislikesCount: dislikesCountMap.get(postId) ?? 0,
        myStatus: myStatusMap.get(postId) ?? LikeStatus.None,
        newestLikes: newestLikesMap.get(postId) ?? [],
      });
    }

    return likesInfoMap;
  }

  private async getLikesCount(postIds: string[]): Promise<{ postId: string; likesCount: number }[]> {
    if (postIds.length === 0) {
      return [];
    }

    return this.model.aggregate<{ postId: string; likesCount: number }>([
      { $match: { postId: { $in: postIds } } },
      {
        $project: {
          _id: 0,
          postId: 1,
          likesCount: { $size: '$likes' },
        },
      },
    ]);
  }

  private async getDislikesCount(postIds: string[]): Promise<{ postId: string; dislikesCount: number }[]> {
    if (postIds.length === 0) {
      return [];
    }

    return this.model.aggregate<{ postId: string; dislikesCount: number }>([
      { $match: { postId: { $in: postIds } } },
      {
        $project: {
          _id: 0,
          postId: 1,
          dislikesCount: { $size: '$dislikes' },
        },
      },
    ]);
  }

  private async getLikeStatus(
    postIds: string[],
    userId: string | null,
  ): Promise<{ postId: string; myStatus: LikeStatus }[]> {
    if (postIds.length === 0) {
      return [];
    }

    if (userId === null) {
      return postIds.map((postId) => ({ postId, myStatus: LikeStatus.None }));
    }

    return this.model.aggregate<{ postId: string; myStatus: LikeStatus }>([
      { $match: { postId: { $in: postIds } } },
      {
        $project: {
          _id: 0,
          postId: 1,
          myStatus: {
            $switch: {
              branches: [
                { case: { $in: [userId, '$likes.userId'] }, then: LikeStatus.Like },
                { case: { $in: [userId, '$dislikes.userId'] }, then: LikeStatus.Dislike },
              ],
              default: LikeStatus.None,
            },
          },
        },
      },
    ]);
  }

  private async getNewestLikes(
    postIds: string[],
  ): Promise<{ postId: string; addedAt: Date; userId: string }[]> {
    if (postIds.length === 0) {
      return [];
    }

    return this.model.aggregate<{ postId: string; addedAt: Date; userId: string }>([
      { $match: { postId: { $in: postIds } } },
      { $unwind: '$likes' },
      { $sort: { postId: 1, 'likes.createdAt': -1 } },
      {
        $group: {
          _id: '$postId',
          likes: { $push: '$likes' },
        },
      },
      {
        $project: {
          _id: 0,
          postId: '$_id',
          likes: { $slice: ['$likes', this.core.newestLikesNumber] },
        },
      },
      { $unwind: '$likes' },
      {
        $project: {
          _id: 0,
          postId: 1,
          addedAt: '$likes.createdAt',
          userId: '$likes.userId',
        },
      },
    ]);
  }
}
