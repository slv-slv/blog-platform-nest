import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import {
  SetCommentLikeRepoParams,
  SetCommentNoneRepoParams,
} from '../../types/comment-likes.types.js';

@Injectable()
export class CommentLikesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getLikesCount(commentIdArr: number[]): Promise<{ commentId: number; likesCount: number }[]> {
    const result = await this.pool.query(
      `
        SELECT
          comment_id AS "commentId",
          COUNT(user_id)::int AS "likesCount"
        FROM comment_likes
        WHERE comment_id = ANY($1::int[])
        GROUP BY comment_id
      `,
      [commentIdArr],
    );

    return result.rows;
  }

  async getDislikesCount(commentIdArr: number[]): Promise<{ commentId: number; dislikesCount: number }[]> {
    const result = await this.pool.query(
      `
        SELECT
          comment_id AS "commentId",
          COUNT(user_id)::int AS "dislikesCount"
        FROM comment_dislikes
        WHERE comment_id = ANY($1::int[])
        GROUP BY comment_id
      `,
      [commentIdArr],
    );

    return result.rows;
  }

  async getLikeStatus(
    commentIdArr: number[],
    userId: string | null,
  ): Promise<{ commentId: number; myStatus: LikeStatus }[]> {
    if (userId === null) {
      return commentIdArr.map((commentId) => ({ commentId, myStatus: LikeStatus.None }));
    }

    const result = await this.pool.query(
      `
        SELECT
          c.comment_id AS "commentId",
          CASE
            WHEN cl.user_id IS NOT NULL THEN 'Like'
            WHEN cd.user_id IS NOT NULL THEN 'Dislike'
            ELSE 'None'
          END AS "myStatus"
        FROM unnest($1::int[]) AS c(comment_id)
        LEFT JOIN comment_likes AS cl
          ON c.comment_id = cl.comment_id
          AND cl.user_id = $2::int
        LEFT JOIN comment_dislikes AS cd
          ON c.comment_id = cd.comment_id
          AND cd.user_id = $2::int
      `,
      [commentIdArr, userId],
    );

    return result.rows;
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
