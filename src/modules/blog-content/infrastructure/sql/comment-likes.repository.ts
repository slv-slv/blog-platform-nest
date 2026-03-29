import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import { SetCommentLikeRepoParams, SetCommentNoneRepoParams } from '../../types/comment-likes.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class CommentLikesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getLikesCount(commentIds: number[]): Promise<{ commentId: number; likesCount: number }[]> {
    const result = await this.pool.query<{ commentId: number; likesCount: number }>(
      `
        SELECT
          comment_id AS "commentId",
          COUNT(user_id)::int AS "likesCount"
        FROM comment_likes
        WHERE comment_id = ANY($1)
        GROUP BY comment_id
      `,
      [commentIds],
    );

    return result.rows;
  }

  async getDislikesCount(commentIds: number[]): Promise<{ commentId: number; dislikesCount: number }[]> {
    const result = await this.pool.query<{ commentId: number; dislikesCount: number }>(
      `
        SELECT
          comment_id AS "commentId",
          COUNT(user_id)::int AS "dislikesCount"
        FROM comment_dislikes
        WHERE comment_id = ANY($1)
        GROUP BY comment_id
      `,
      [commentIds],
    );

    return result.rows;
  }

  async getLikeStatus(
    commentIds: number[],
    userId: string | null,
  ): Promise<{ commentId: number; myStatus: LikeStatus }[]> {
    if (userId === null || !isPositiveIntegerString(userId)) {
      return commentIds.map((commentId) => ({ commentId, myStatus: LikeStatus.None }));
    }

    const userIdNum = +userId;

    const result = await this.pool.query<{ commentId: number; myStatus: LikeStatus }>(
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
          AND cl.user_id = $2
        LEFT JOIN comment_dislikes AS cd
          ON c.comment_id = cd.comment_id
          AND cd.user_id = $2
      `,
      [commentIds, userIdNum],
    );

    return result.rows;
  }

  async setLike(params: SetCommentLikeRepoParams): Promise<void> {
    const { commentId, userId, createdAt } = params;

    if (!isPositiveIntegerString(commentId) || !isPositiveIntegerString(userId)) {
      return;
    }

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

    if (!isPositiveIntegerString(commentId) || !isPositiveIntegerString(userId)) {
      return;
    }

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

    if (!isPositiveIntegerString(commentId) || !isPositiveIntegerString(userId)) {
      return;
    }

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
