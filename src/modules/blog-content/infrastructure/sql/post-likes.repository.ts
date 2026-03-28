import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import { SetPostLikeRepoParams, SetPostNoneRepoParams } from '../../types/post-likes.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class PostLikesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getLikeStatus(
    postIdArr: number[],
    userId: string | null,
  ): Promise<{ postId: number; myStatus: LikeStatus }[]> {
    if (userId === null || !isPositiveIntegerString(userId)) {
      return postIdArr.map((postId) => ({ postId, myStatus: LikeStatus.None }));
    }

    const userIdNum = +userId;

    const myStatusResult = await this.pool.query<{ postId: number; myStatus: LikeStatus }>(
      `
        SELECT
          p.post_id AS "postId",
          CASE
            WHEN pl.user_id IS NOT NULL THEN 'Like'
            WHEN pd.user_id IS NOT NULL THEN 'Dislike'
            ELSE 'None'
          END AS "myStatus"
        FROM unnest($1::int[]) AS p(post_id)
        LEFT JOIN post_likes AS pl
          ON p.post_id = pl.post_id
          AND pl.user_id = $2
        LEFT JOIN post_dislikes AS pd
          ON p.post_id = pd.post_id
          AND pd.user_id = $2
      `,
      [postIdArr, userIdNum],
    );

    return myStatusResult.rows;
  }
  async setLike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;

    if (!isPositiveIntegerString(postId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const postIdNum = +postId;
    const userIdNum = +userId;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
      );
      await client.query(
        `
          INSERT INTO post_likes (post_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [postIdNum, userIdNum, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  async setDislike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;

    if (!isPositiveIntegerString(postId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const postIdNum = +postId;
    const userIdNum = +userId;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
      );
      await client.query(
        `
          INSERT INTO post_dislikes (post_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [postIdNum, userIdNum, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  async setNone(params: SetPostNoneRepoParams): Promise<void> {
    const { postId, userId } = params;

    if (!isPositiveIntegerString(postId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const postIdNum = +postId;
    const userIdNum = +userId;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
      );
      await client.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
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
