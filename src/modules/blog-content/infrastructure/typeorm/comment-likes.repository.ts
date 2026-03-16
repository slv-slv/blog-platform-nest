import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import {
  CommentLikeStatusRepoParams,
  SetCommentLikeRepoParams,
  SetCommentNoneRepoParams,
} from '../../types/comment-likes.types.js';

@Injectable()
export class CommentLikesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getLikesCount(commentId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_likes
        WHERE comment_id = $1::int
      `,
      [commentId],
    );

    return result.rows[0].count;
  }

  async getDislikesCount(commentId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_dislikes
        WHERE comment_id = $1::int
      `,
      [commentId],
    );

    return result.rows[0].count;
  }

  async getLikeStatus(params: CommentLikeStatusRepoParams): Promise<LikeStatus> {
    const { commentId, userId } = params;
    if (userId === null) return LikeStatus.None;

    const likeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_likes
        WHERE comment_id = $1::int AND user_id = $2::int
      `,
      [commentId, userId],
    );

    if (likeResult.rows[0].count > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_dislikes
        WHERE comment_id = $1::int AND user_id = $2::int
      `,
      [commentId, userId],
    );

    if (dislikeResult.rows[0].count > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  async deleteLikesInfo(commentId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM comment_likes WHERE comment_id = $1::int', [commentId]);
      await client.query('DELETE FROM comment_dislikes WHERE comment_id = $1::int', [commentId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async setLike(params: SetCommentLikeRepoParams): Promise<void> {
    const { commentId, userId, createdAt } = params;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_dislikes
          WHERE comment_id = $1::int AND user_id = $2::int
        `,
        [commentId, userId],
      );
      await client.query(
        `
          INSERT INTO comment_likes (comment_id, user_id, created_at)
          VALUES ($1::int, $2::int, $3)
          ON CONFLICT (comment_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [commentId, userId, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  async setDislike(params: SetCommentLikeRepoParams): Promise<void> {
    const { commentId, userId, createdAt } = params;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_likes
          WHERE comment_id = $1::int AND user_id = $2::int
        `,
        [commentId, userId],
      );
      await client.query(
        `
          INSERT INTO comment_dislikes (comment_id, user_id, created_at)
          VALUES ($1::int, $2::int, $3)
          ON CONFLICT (comment_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [commentId, userId, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  async setNone(params: SetCommentNoneRepoParams): Promise<void> {
    const { commentId, userId } = params;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_likes
          WHERE comment_id = $1::int AND user_id = $2::int
        `,
        [commentId, userId],
      );
      await client.query(
        `
          DELETE FROM comment_dislikes
          WHERE comment_id = $1::int AND user_id = $2::int
        `,
        [commentId, userId],
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
