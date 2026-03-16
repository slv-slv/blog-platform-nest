import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostLikes } from './post-likes.schemas.js';
import { PostLikesType, SetPostLikeRepoParams, SetPostNoneRepoParams } from '../../types/post-likes.types.js';
import { Model } from 'mongoose';
import { LikeStatus } from '../../types/likes.types.js';
import { ConfigType } from '@nestjs/config';
import { coreConfig } from '../../../../config/core.config.js';

@Injectable()
export class PostLikesRepository {
  constructor(
    @InjectModel(PostLikes.name) private readonly model: Model<PostLikesType>,
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
  ) {}

  async getLikesCount(postIdArr: string[]): Promise<{ postId: string; likesCount: number }[]> {
    if (postIdArr.length === 0) {
      return [];
    }

    return this.model.aggregate<{ postId: string; likesCount: number }>([
      { $match: { postId: { $in: postIdArr } } },
      {
        $project: {
          _id: 0,
          postId: 1,
          likesCount: { $size: '$likes' },
        },
      },
    ]);
  }

  async getDislikesCount(postIdArr: string[]): Promise<{ postId: string; dislikesCount: number }[]> {
    if (postIdArr.length === 0) {
      return [];
    }

    return this.model.aggregate<{ postId: string; dislikesCount: number }>([
      { $match: { postId: { $in: postIdArr } } },
      {
        $project: {
          _id: 0,
          postId: 1,
          dislikesCount: { $size: '$dislikes' },
        },
      },
    ]);
  }

  async getLikeStatus(
    postIdArr: string[],
    userId: string | null,
  ): Promise<{ postId: string; myStatus: LikeStatus }[]> {
    if (postIdArr.length === 0) {
      return [];
    }

    if (userId === null) {
      return postIdArr.map((postId) => ({ postId, myStatus: LikeStatus.None }));
    }

    return this.model.aggregate<{ postId: string; myStatus: LikeStatus }>([
      { $match: { postId: { $in: postIdArr } } },
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

  async getNewestLikes(postIdArr: string[]): Promise<{ postId: string; addedAt: Date; userId: string }[]> {
    if (postIdArr.length === 0) {
      return [];
    }

    return this.model.aggregate<{ postId: string; addedAt: Date; userId: string }>([
      { $match: { postId: { $in: postIdArr } } },
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

  async createEmptyLikesInfo(postId: string): Promise<void> {
    const likesInfo: PostLikesType = {
      postId,
      likes: [],
      dislikes: [],
    };
    await this.model.create(likesInfo);
  }

  // async deleteLikesInfo(postId: string): Promise<void> {
  //   await this.model.deleteOne({ postId });
  // }

  async setLike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;
    await this.setReaction(postId, 'likes', userId, createdAt);
  }

  async setDislike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;
    await this.setReaction(postId, 'dislikes', userId, createdAt);
  }

  async setNone(params: SetPostNoneRepoParams): Promise<void> {
    const { postId, userId } = params;
    await this.model.updateOne(
      { postId },
      { $pull: { likes: { userId }, dislikes: { userId } } },
      { runValidators: true },
    );
  }

  private async setReaction(
    postId: string,
    target: 'likes' | 'dislikes',
    userId: string,
    createdAt: Date,
  ): Promise<void> {
    await this.model.bulkWrite([
      {
        updateOne: {
          filter: { postId },
          update: { $setOnInsert: { postId, likes: [], dislikes: [] } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { postId },
          update: { $pull: { likes: { userId }, dislikes: { userId } } },
        },
      },
      {
        updateOne: {
          filter: { postId },
          update: { $push: { [target]: { userId, createdAt } } },
        },
      },
    ]);
  }
}
