import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SetCommentLikeRepoParams, SetCommentNoneRepoParams } from '../../types/comment-likes.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { CommentDislike, CommentLike } from './comment-likes.entities.js';

@Injectable()
export class CommentLikesRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getLikeStatus(
    commentIds: number[],
    userId: string | null,
  ): Promise<{ commentId: number; myStatus: LikeStatus }[]> {
    if (userId === null || !isPositiveIntegerString(userId)) {
      return commentIds.map((commentId) => ({ commentId, myStatus: LikeStatus.None }));
    }

    const userIdNum = +userId;

    return await this.dataSource
      .createQueryBuilder()
      .select('c."commentId"', 'commentId')
      .addSelect(
        `
          CASE
            WHEN commentLike.userId IS NOT NULL THEN 'Like'
            WHEN commentDislike.userId IS NOT NULL THEN 'Dislike'
            ELSE 'None'
          END
        `,
        'myStatus',
      )
      .from('unnest(:commentIds::int[])', 'c(commentId)')
      .leftJoin(
        CommentLike,
        'commentLike',
        'c."commentId" = commentLike.commentId AND commentLike.userId = :userId',
      )
      .leftJoin(
        CommentDislike,
        'commentDislike',
        'c."commentId" = commentDislike.commentId AND commentDislike.userId = :userId',
      )
      .setParameters({ commentIds, userId: userIdNum })
      .getRawMany<{ commentId: number; myStatus: LikeStatus }>();
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
