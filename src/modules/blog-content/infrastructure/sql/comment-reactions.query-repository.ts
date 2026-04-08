import { Inject, Injectable } from '@nestjs/common';
import { GetCommentLikesInfoParams, LikeStatus, LikesInfoViewModel } from '../../types/likes.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class CommentReactionsQueryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getLikesInfo(params: GetCommentLikesInfoParams<number>): Promise<Map<number, LikesInfoViewModel>> {
    const { commentIds, userId = null } = params;
    const likesCountArr = await this.getLikesCount(commentIds);
    const likesCountMap = new Map(likesCountArr.map(({ commentId, likesCount }) => [commentId, likesCount]));

    const dislikesCountArr = await this.getDislikesCount(commentIds);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ commentId, dislikesCount }) => [commentId, dislikesCount]),
    );

    const myStatusArr = await this.getLikeStatus(commentIds, userId);
    const myStatusMap = new Map(myStatusArr.map(({ commentId, myStatus }) => [commentId, myStatus]));

    const likesInfoMap = new Map<number, LikesInfoViewModel>();
    for (const commentId of commentIds) {
      likesInfoMap.set(commentId, {
        likesCount: likesCountMap.get(commentId) ?? 0,
        dislikesCount: dislikesCountMap.get(commentId) ?? 0,
        myStatus: myStatusMap.get(commentId) ?? LikeStatus.None,
      });
    }

    return likesInfoMap;
  }

  private async getLikesCount(commentIds: number[]): Promise<{ commentId: number; likesCount: number }[]> {
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

  private async getDislikesCount(
    commentIds: number[],
  ): Promise<{ commentId: number; dislikesCount: number }[]> {
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

  private async getLikeStatus(
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
}
