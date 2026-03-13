import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentLikes } from './comment-likes.schemas.js';
import {
  CommentLikeStatusRepoParams,
  CommentLikesType,
  SetCommentLikeRepoParams,
  SetCommentNoneRepoParams,
} from '../../types/comment-likes.types.js';
import { Model } from 'mongoose';
import { LikeStatus } from '../../types/likes.types.js';

@Injectable()
export class CommentLikesRepository {
  constructor(@InjectModel(CommentLikes.name) private readonly model: Model<CommentLikesType>) {}
  async getLikesCount(commentId: string): Promise<number> {
    const comment = await this.model.findOne({ commentId }).lean();
    if (!comment) return 0;

    const result = await this.model.aggregate([
      { $match: { commentId } },
      { $project: { likesCount: { $size: '$likes' } } },
    ]);
    return result[0].likesCount;
  }

  async getDislikesCount(commentId: string): Promise<number> {
    const comment = await this.model.findOne({ commentId }).lean();
    if (!comment) return 0;

    const result = await this.model.aggregate([
      { $match: { commentId } },
      { $project: { dislikesCount: { $size: '$dislikes' } } },
    ]);
    return result[0].dislikesCount;
  }

  async getLikeStatus(params: CommentLikeStatusRepoParams): Promise<LikeStatus> {
    const { commentId, userId } = params;
    if (userId === null) return LikeStatus.None;

    const comment = await this.model
      .findOne(
        { commentId },
        {
          likes: { $elemMatch: { userId } },
          dislikes: { $elemMatch: { userId } },
        },
      )
      .lean();

    if (!comment) return LikeStatus.None;

    if (comment.likes) return LikeStatus.Like;
    if (comment.dislikes) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  async createEmptyLikesInfo(commentId: string): Promise<void> {
    const likesInfo: CommentLikesType = {
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
    const like = { userId, createdAt };

    await this.model.updateOne(
      { commentId },
      { $setOnInsert: { commentId, likes: [], dislikes: [] } },
      { upsert: true, runValidators: true },
    );

    await this.model.updateOne(
      { commentId },
      {
        $push: { likes: like },
        $pull: { dislikes: { userId: userId } },
      },
    );
  }

  async setDislike(params: SetCommentLikeRepoParams): Promise<void> {
    const { commentId, userId, createdAt } = params;
    const dislike = { userId, createdAt };

    await this.model.updateOne(
      { commentId },
      { $setOnInsert: { commentId, likes: [], dislikes: [] } },
      { upsert: true, runValidators: true },
    );

    await this.model.updateOne(
      { commentId },
      {
        $push: { dislikes: dislike },
        $pull: { likes: { userId: userId } },
      },
      { runValidators: true },
    );
  }

  async setNone(params: SetCommentNoneRepoParams): Promise<void> {
    const { commentId, userId } = params;
    await this.model.updateOne(
      { commentId },
      {
        $pull: { likes: { userId: userId }, dislikes: { userId: userId } },
      },
      { runValidators: true },
    );
  }
}
