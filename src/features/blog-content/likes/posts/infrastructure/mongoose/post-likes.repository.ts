import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostLikes } from './post-likes.schemas.js';
import { PostLikesType } from '../../post-likes.types.js';
import { Model } from 'mongoose';
import { LikeStatus } from '../../../types/likes.types.js';
import { pool } from '../../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class PostLikesRepository {
  constructor(
    @InjectModel(PostLikes.name) private readonly model: Model<PostLikesType>,
    @Inject(pool) private readonly pool: Pool,
  ) {}
  // async getLikesCount(postId: string): Promise<number> {
  //   const post = await this.model.findOne({ postId }).lean();
  //   if (!post) return 0;

  //   const result = await this.model.aggregate([
  //     { $match: { postId } },
  //     { $project: { likesCount: { $size: '$likes' } } },
  //   ]);
  //   return result[0].likesCount;
  // }

  async getLikesCount(postId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM post_likes
        WHERE post_id = $1
      `,
      [parseInt(postId)],
    );

    return parseInt(result.rows[0].count);
  }

  // async getDislikesCount(postId: string): Promise<number> {
  //   const post = await this.model.findOne({ postId }).lean();
  //   if (!post) return 0;

  //   const result = await this.model.aggregate([
  //     { $match: { postId } },
  //     { $project: { dislikesCount: { $size: '$dislikes' } } },
  //   ]);
  //   return result[0].dislikesCount;
  // }

  async getDislikesCount(postId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM post_dislikes
        WHERE post_id = $1
      `,
      [parseInt(postId)],
    );

    return parseInt(result.rows[0].count);
  }

  // async getLikeStatus(postId: string, userId: string): Promise<LikeStatus> {
  //   if (userId === null) return LikeStatus.None;

  //   const post = await this.model
  //     .findOne(
  //       { postId },
  //       {
  //         likes: { $elemMatch: { userId } },
  //         dislikes: { $elemMatch: { userId } },
  //       },
  //     )
  //     .lean();

  //   if (!post) return LikeStatus.None;

  //   if (post.likes) return LikeStatus.Like;
  //   if (post.dislikes) return LikeStatus.Dislike;

  //   return LikeStatus.None;
  // }

  async getLikeStatus(postId: string, userId: string): Promise<LikeStatus> {
    if (userId === null) return LikeStatus.None;

    const postIdInt = parseInt(postId);
    const userIdInt = parseInt(userId);

    const likeResult = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM post_likes
        WHERE post_id = $1 AND user_id = $2
      `,
      [postIdInt, userIdInt],
    );

    if (likeResult.rows[0] > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM post_dislikes
        WHERE post_id = $1 AND user_id = $2
      `,
      [postIdInt, userIdInt],
    );

    if (dislikeResult.rows[0] > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  // async createEmptyLikesInfo(postId: string): Promise<void> {
  //   const likesInfo: PostLikesType = {
  //     postId,
  //     likes: [],
  //     dislikes: [],
  //   };
  //   await this.model.insertOne(likesInfo);
  // }

  // async deleteLikesInfo(postId: string): Promise<void> {
  //   await this.model.deleteOne({ postId });
  // }

  // async deleteLikesInfo(postId: string): Promise<void> {
  //   const client = await this.pool.connect();
  //   try {
  //     await client.query('BEGIN');
  //     await client.query('DELETE FROM post_likes WHERE post_id = $1', [parseInt(postId)]);
  //     await client.query('DELETE FROM post_dislikes WHERE post_id = $1', [parseInt(postId)]);
  //     await client.query('COMMIT');
  //   } catch (e) {
  //     await client.query('ROLLBACK');
  //     throw e;
  //   } finally {
  //     client.release();
  //   }
  // }

  // async setLike(postId: string, userId: string, createdAt: Date): Promise<void> {
  //   const like = { userId, createdAt };

  //   await this.model.updateOne(
  //     { postId },
  //     { $setOnInsert: { postId, likes: [], dislikes: [] } },
  //     { upsert: true },
  //   );

  //   await this.model.updateOne(
  //     { postId },
  //     { $push: { likes: like }, $pull: { dislikes: { userId: userId } } },
  //   );
  // }

  async setLike(postId: string, userId: string, createdAt: Date): Promise<void> {
    const postIdInt = parseInt(postId);
    const userIdInt = parseInt(userId);

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdInt, userIdInt],
      );
      await client.query(
        `
          INSERT INTO post_likes (post_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.createt_at
        `,
        [postIdInt, userIdInt, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  // async setDislike(postId: string, userId: string, createdAt: Date): Promise<void> {
  //   const dislike = { userId, createdAt };

  //   await this.model.updateOne(
  //     { postId },
  //     { $setOnInsert: { postId, likes: [], dislikes: [] } },
  //     { upsert: true },
  //   );

  //   await this.model.updateOne(
  //     { postId },
  //     { $push: { dislikes: dislike }, $pull: { likes: { userId: userId } } },
  //   );
  // }

  async setDislike(postId: string, userId: string, createdAt: Date): Promise<void> {
    const postIdInt = parseInt(postId);
    const userIdInt = parseInt(userId);

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdInt, userIdInt],
      );
      await client.query(
        `
          INSERT INTO post_dislikes (post_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [postIdInt, userIdInt, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  // async setNone(postId: string, userId: string): Promise<void> {
  //   await this.model.updateOne(
  //     { postId },
  //     { $pull: { likes: { userId: userId }, dislikes: { userId: userId } } },
  //   );
  // }

  async setNone(postId: string, userId: string): Promise<void> {
    const postIdInt = parseInt(postId);
    const userIdInt = parseInt(userId);

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdInt, userIdInt],
      );
      await client.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdInt, userIdInt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }
}
