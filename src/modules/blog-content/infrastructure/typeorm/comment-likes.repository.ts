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
    const commentIdNum = +commentId;
    const result = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_likes
        WHERE comment_id = $1
      `,
      [commentIdNum],
    );

    return result.rows[0].count;
  }

  async getDislikesCount(commentId: string): Promise<number> {
    const commentIdNum = +commentId;
    const result = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_dislikes
        WHERE comment_id = $1
      `,
      [commentIdNum],
    );

    return result.rows[0].count;
  }

  async getLikeStatus(params: CommentLikeStatusRepoParams): Promise<LikeStatus> {
    const { commentId, userId } = params;
    if (userId === null) return LikeStatus.None;

    const commentIdNum = +commentId;
    const userIdNum = +userId;

    const likeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_likes
        WHERE comment_id = $1 AND user_id = $2
      `,
      [commentIdNum, userIdNum],
    );

    if (likeResult.rows[0].count > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM comment_dislikes
        WHERE comment_id = $1 AND user_id = $2
      `,
      [commentIdNum, userIdNum],
    );

    if (dislikeResult.rows[0].count > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  async deleteLikesInfo(commentId: string): Promise<void> {
    const commentIdNum = +commentId;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM comment_likes WHERE comment_id = $1', [commentIdNum]);
      await client.query('DELETE FROM comment_dislikes WHERE comment_id = $1', [commentIdNum]);
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
    const commentIdNum = +commentId;
    const userIdNum = +userId;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_dislikes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdNum, userIdNum],
      );
      await client.query(
        `
          INSERT INTO comment_likes (comment_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (comment_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [commentIdNum, userIdNum, createdAt],
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
    const commentIdNum = +commentId;
    const userIdNum = +userId;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_likes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdNum, userIdNum],
      );
      await client.query(
        `
          INSERT INTO comment_dislikes (comment_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (comment_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [commentIdNum, userIdNum, createdAt],
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
    const commentIdNum = +commentId;
    const userIdNum = +userId;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM comment_likes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdNum, userIdNum],
      );
      await client.query(
        `
          DELETE FROM comment_dislikes
          WHERE comment_id = $1 AND user_id = $2
        `,
        [commentIdNum, userIdNum],
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
