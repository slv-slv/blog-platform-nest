import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentLikes } from './comment-likes.schemas.js';
import { CommentLikesType } from '../../comment-likes.types.js';
import { Model } from 'mongoose';
import { LikeStatus } from '../../../types/likes.types.js';
import { pool } from '../../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class CommentLikesRepository {
  constructor(
    @InjectModel(CommentLikes.name) private readonly model: Model<CommentLikesType>,
    @Inject(pool) private readonly pool: Pool,
  ) {}
  // async getLikesCount(commentId: string): Promise<number> {
  //   const result = await this.model.aggregate([
  //     { $match: { commentId } },
  //     { $project: { likesCount: { $size: '$likes' } } },
  //   ]);
  //   return result[0]?.likesCount ?? 0;
  // }

  async getLikesCount(commentId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM comment_likes
        WHERE comment_id = $1
      `,
      [parseInt(commentId)],
    );

    return result.rows[0];
  }

  // async getDislikesCount(commentId: string): Promise<number> {
  //   const result = await this.model.aggregate([
  //     { $match: { commentId } },
  //     { $project: { dislikesCount: { $size: '$dislikes' } } },
  //   ]);
  //   return result[0]?.dislikesCount ?? 0;
  // }

  async getDislikesCount(commentId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM comment_dislikes
        WHERE comment_id = $1
      `,
      [parseInt(commentId)],
    );

    return result.rows[0];
  }

  async getLikeStatus(commentId: string, userId: string): Promise<LikeStatus> {
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

    if (comment!.likes) return LikeStatus.Like;
    if (comment!.dislikes) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  async createLikesInfo(likesInfo: CommentLikesType): Promise<void> {
    await this.model.insertOne(likesInfo);
  }

  async deleteLikesInfo(commentId: string): Promise<void> {
    await this.model.deleteOne({ commentId });
  }

  async setLike(commentId: string, userId: string, createdAt: Date): Promise<void> {
    const like = { userId, createdAt };
    await this.model.updateOne(
      { commentId },
      { $push: { likes: like }, $pull: { dislikes: { userId: userId } } },
    );
  }

  async setDislike(commentId: string, userId: string, createdAt: Date): Promise<void> {
    const dislike = { userId, createdAt };
    await this.model.updateOne(
      { commentId },
      { $push: { dislikes: dislike }, $pull: { likes: { userId: userId } } },
    );
  }

  async setNone(commentId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { commentId },
      { $pull: { likes: { userId: userId }, dislikes: { userId: userId } } },
    );
  }
}
