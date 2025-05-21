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
  //   const comment = await this.model.findOne({ commentId }).lean();
  //   if (!comment) return 0;

  //   const result = await this.model.aggregate([
  //     { $match: { commentId } },
  //     { $project: { likesCount: { $size: '$likes' } } },
  //   ]);
  //   return result[0].likesCount;
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
  //   const comment = await this.model.findOne({ commentId }).lean();
  //   if (!comment) return 0;

  //   const result = await this.model.aggregate([
  //     { $match: { commentId } },
  //     { $project: { dislikesCount: { $size: '$dislikes' } } },
  //   ]);
  //   return result[0].dislikesCount;
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

  // async getLikeStatus(commentId: string, userId: string): Promise<LikeStatus> {
  //   if (userId === null) return LikeStatus.None;

  //   const comment = await this.model
  //     .findOne(
  //       { commentId },
  //       {
  //         likes: { $elemMatch: { userId } },
  //         dislikes: { $elemMatch: { userId } },
  //       },
  //     )
  //     .lean();

  //   if (!comment) return LikeStatus.None;

  //   if (comment!.likes) return LikeStatus.Like;
  //   if (comment!.dislikes) return LikeStatus.Dislike;

  //   return LikeStatus.None;
  // }

  async getLikeStatus(commentId: string, userId: string): Promise<LikeStatus> {
    if (userId === null) return LikeStatus.None;

    const commentIdInt = parseInt(commentId);
    const userIdInt = parseInt(userId);

    const likeResult = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM comment_likes
        WHERE comment_id = $1 AND user_id = $2
      `,
      [commentIdInt, userIdInt],
    );

    if (likeResult.rows[0] > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM comment_dislikes
        WHERE comment_id = $1 AND user_id = $2
      `,
      [commentIdInt, userIdInt],
    );

    if (dislikeResult.rows[0] > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  // async createEmptyLikesInfo(commentId: string): Promise<void> {
  //   const likesInfo: CommentLikesType = {
  //     commentId,
  //     likes: [],
  //     dislikes: [],
  //   };
  //   await this.model.insertOne(likesInfo);
  // }

  // async deleteLikesInfo(commentId: string): Promise<void> {
  //   await this.model.deleteOne({ commentId });
  // }

  // async deleteLikesInfo(commentId: string): Promise<void> {
  //   const client = await this.pool.connect();
  //   try {
  //     await client.query('BEGIN');
  //     await client.query('DELETE FROM comment_likes WHERE comment_id = $1', [parseInt(commentId)]);
  //     await client.query('DELETE FROM comment_dislikes WHERE comment_id = $1', [parseInt(commentId)]);
  //     await client.query('COMMIT');
  //   } catch (e) {
  //     await client.query('ROLLBACK');
  //     throw e;
  //   } finally {
  //     client.release();
  //   }
  // }

  // async setLike(commentId: string, userId: string, createdAt: Date): Promise<void> {
  //   const like = { userId, createdAt };

  //   await this.model.updateOne(
  //     { commentId },
  //     { $setOnInsert: { commentId, likes: [], dislikes: [] } },
  //     { upsert: true },
  //   );

  //   await this.model.updateOne(
  //     { commentId },
  //     {
  //       $push: { likes: like },
  //       $pull: { dislikes: { userId: userId } },
  //     },
  //   );
  // }

  async setLike(commentId: string, userId: string, createdAt: Date): Promise<void> {
    const commentIdInt = parseInt(commentId);
    const userIdInt = parseInt(userId);

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_dislikes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdInt, userIdInt],
      );
      await client.query(
        `
          INSERT INTO comment_likes (comment_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (comment_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.createt_at
        `,
        [commentIdInt, userIdInt, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  async setDislike(commentId: string, userId: string, createdAt: Date): Promise<void> {
    const dislike = { userId, createdAt };

    await this.model.updateOne(
      { commentId },
      { $setOnInsert: { commentId, likes: [], dislikes: [] } },
      { upsert: true },
    );

    await this.model.updateOne(
      { commentId },
      {
        $push: { dislikes: dislike },
        $pull: { likes: { userId: userId } },
      },
    );
  }

  async setNone(commentId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { commentId },
      {
        $pull: { likes: { userId: userId }, dislikes: { userId: userId } },
      },
    );
  }
}
