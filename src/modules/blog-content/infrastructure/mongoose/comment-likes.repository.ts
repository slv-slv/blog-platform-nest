import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentLikes } from './comment-likes.schemas.js';
import {
  CommentLikesModel,
  SetCommentLikeRepoParams,
  SetCommentNoneRepoParams,
} from '../../types/comment-likes.types.js';
import { Model } from 'mongoose';
import { LikeStatus } from '../../types/likes.types.js';

@Injectable()
export class CommentLikesRepository {
  constructor(@InjectModel(CommentLikes.name) private readonly model: Model<CommentLikesModel>) {}

  async getLikesCount(commentIdArr: string[]): Promise<{ commentId: string; likesCount: number }[]> {
    if (commentIdArr.length === 0) {
      return [];
    }

    return this.model.aggregate<{ commentId: string; likesCount: number }>([
      { $match: { commentId: { $in: commentIdArr } } },
      {
        $project: {
          _id: 0,
          commentId: 1,
          likesCount: { $size: '$likes' },
        },
      },
    ]);
  }

  async getDislikesCount(commentIdArr: string[]): Promise<{ commentId: string; dislikesCount: number }[]> {
    if (commentIdArr.length === 0) {
      return [];
    }

    return this.model.aggregate<{ commentId: string; dislikesCount: number }>([
      { $match: { commentId: { $in: commentIdArr } } },
      {
        $project: {
          _id: 0,
          commentId: 1,
          dislikesCount: { $size: '$dislikes' },
        },
      },
    ]);
  }

  async getLikeStatus(
    commentIdArr: string[],
    userId: string | null,
  ): Promise<{ commentId: string; myStatus: LikeStatus }[]> {
    if (commentIdArr.length === 0) {
      return [];
    }

    if (userId === null) {
      return commentIdArr.map((commentId) => ({ commentId, myStatus: LikeStatus.None }));
    }

    return this.model.aggregate<{ commentId: string; myStatus: LikeStatus }>([
      { $match: { commentId: { $in: commentIdArr } } },
      {
        $project: {
          _id: 0,
          commentId: 1,
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

  async createEmptyLikesInfo(commentId: string): Promise<void> {
    const likesInfo: CommentLikesModel = {
      commentId,
      likes: [],
      dislikes: [],
    };
    await this.model.create(likesInfo);
  }

  // async deleteLikesInfo(commentId: string): Promise<void> {
  //   await this.model.deleteOne({ commentId });
  // }

  async setLike(params: SetCommentLikeRepoParams): Promise<void> {
    const { commentId, userId, createdAt } = params;
    await this.setReaction(commentId, 'likes', userId, createdAt);
  }

  async setDislike(params: SetCommentLikeRepoParams): Promise<void> {
    const { commentId, userId, createdAt } = params;
    await this.setReaction(commentId, 'dislikes', userId, createdAt);
  }

  async setNone(params: SetCommentNoneRepoParams): Promise<void> {
    const { commentId, userId } = params;
    await this.model.updateOne(
      { commentId },
      {
        $pull: { likes: { userId }, dislikes: { userId } },
      },
      { runValidators: true },
    );
  }

  private async setReaction(
    commentId: string,
    target: 'likes' | 'dislikes',
    userId: string,
    createdAt: Date,
  ): Promise<void> {
    await this.model.bulkWrite([
      {
        updateOne: {
          filter: { commentId },
          update: { $setOnInsert: { commentId, likes: [], dislikes: [] } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { commentId },
          update: { $pull: { likes: { userId }, dislikes: { userId } } },
        },
      },
      {
        updateOne: {
          filter: { commentId },
          update: { $push: { [target]: { userId, createdAt } } },
        },
      },
    ]);
  }
}
