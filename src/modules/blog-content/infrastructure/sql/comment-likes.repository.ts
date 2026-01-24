import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';

@Injectable()
export class CommentLikesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getLikesCount(commentId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM comment_likes
        WHERE comment_id = $1
      `,
      [parseInt(commentId)],
    );

    return parseInt(result.rows[0].count);
  }

  async getDislikesCount(commentId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM comment_dislikes
        WHERE comment_id = $1
      `,
      [parseInt(commentId)],
    );

    return parseInt(result.rows[0].count);
  }

  async getLikeStatus(commentId: string, userId: string | null): Promise<LikeStatus> {
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

    if (parseInt(likeResult.rows[0].count) > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)
        FROM comment_dislikes
        WHERE comment_id = $1 AND user_id = $2
      `,
      [commentIdInt, userIdInt],
    );

    if (parseInt(dislikeResult.rows[0].count) > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  async deleteLikesInfo(commentId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM comment_likes WHERE comment_id = $1', [parseInt(commentId)]);
      await client.query('DELETE FROM comment_dislikes WHERE comment_id = $1', [parseInt(commentId)]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

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
          SET created_at = EXCLUDED.created_at
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
    const commentIdInt = parseInt(commentId);
    const userIdInt = parseInt(userId);

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_likes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdInt, userIdInt],
      );
      await client.query(
        `
          INSERT INTO comment_dislikes (comment_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (comment_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
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

  async setNone(commentId: string, userId: string): Promise<void> {
    const commentIdInt = parseInt(commentId);
    const userIdInt = parseInt(userId);

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_likes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdInt, userIdInt],
      );
      await client.query(
        `
          DELETE FROM comment_dislikes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdInt, userIdInt],
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
