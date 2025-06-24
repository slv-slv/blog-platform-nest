import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../../types/likes.types.js';
import { pool } from '../../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class PostLikesRepository {
  constructor(@Inject(pool) private readonly pool: Pool) {}

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

  async getLikeStatus(postId: string, userId: string | null): Promise<LikeStatus> {
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

    if (parseInt(likeResult.rows[0].count) > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM post_dislikes
        WHERE post_id = $1 AND user_id = $2
      `,
      [postIdInt, userIdInt],
    );

    if (parseInt(dislikeResult.rows[0].count) > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

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
