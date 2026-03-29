import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ExtendedLikesInfoViewModel, GetPostLikesInfoParams, LikeStatus } from '../../types/likes.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import { coreConfig } from '../../../../config/core.config.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
  ) {}

  async getLikesInfo(
    params: GetPostLikesInfoParams<number>,
  ): Promise<Map<number, ExtendedLikesInfoViewModel>> {
    const { postIds, userId = null } = params;
    const likesCountArr = await this.getLikesCount(postIds);
    const likesCountMap = new Map(likesCountArr.map(({ postId, likesCount }) => [postId, likesCount]));

    const dislikesCountArr = await this.getDislikesCount(postIds);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ postId, dislikesCount }) => [postId, dislikesCount]),
    );

    const myStatusArr = await this.getLikeStatus(postIds, userId);
    const myStatusMap = new Map(myStatusArr.map(({ postId, myStatus }) => [postId, myStatus]));

    const newestLikesArr = await this.getNewestLikes(postIds);
    const newestLikesMap = new Map<number, { addedAt: string; userId: string; login: string }[]>();
    for (const row of newestLikesArr) {
      const like = newestLikesMap.get(row.postId) ?? [];
      like.push({ addedAt: row.addedAt.toISOString(), userId: row.userId.toString(), login: row.login });
      newestLikesMap.set(row.postId, like);
    }

    const likesInfoMap = new Map<number, ExtendedLikesInfoViewModel>();
    for (const postId of postIds) {
      likesInfoMap.set(postId, {
        likesCount: likesCountMap.get(postId) ?? 0,
        dislikesCount: dislikesCountMap.get(postId) ?? 0,
        myStatus: myStatusMap.get(postId) ?? LikeStatus.None,
        newestLikes: newestLikesMap.get(postId) ?? [],
      });
    }

    return likesInfoMap;
  }

  private async getLikesCount(postIds: number[]): Promise<{ postId: number; likesCount: number }[]> {
    const result = await this.pool.query<{ postId: number; likesCount: number }>(
      `
        SELECT
          post_id AS "postId",
          COUNT(user_id)::int AS "likesCount"
        FROM post_likes
        WHERE post_id = ANY($1)
        GROUP BY post_id
      `,
      [postIds],
    );

    return result.rows;
  }

  private async getDislikesCount(postIds: number[]): Promise<{ postId: number; dislikesCount: number }[]> {
    const result = await this.pool.query<{ postId: number; dislikesCount: number }>(
      `
        SELECT
          post_id AS "postId",
          COUNT(user_id)::int AS "dislikesCount"
        FROM post_dislikes
        WHERE post_id = ANY($1)
        GROUP BY post_id
      `,
      [postIds],
    );

    return result.rows;
  }

  private async getLikeStatus(
    postIds: number[],
    userId: string | null,
  ): Promise<{ postId: number; myStatus: LikeStatus }[]> {
    if (userId === null || !isPositiveIntegerString(userId)) {
      return postIds.map((postId) => ({ postId, myStatus: LikeStatus.None }));
    }

    const userIdNum = +userId;

    const result = await this.pool.query<{ postId: number; myStatus: LikeStatus }>(
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
      [postIds, userIdNum],
    );

    return result.rows;
  }

  private async getNewestLikes(
    postIds: number[],
  ): Promise<{ postId: number; addedAt: Date; userId: number; login: string }[]> {
    const newestLikesNumber = this.core.newestLikesNumber;

    const result = await this.pool.query<{ postId: number; addedAt: Date; userId: number; login: string }>(
      `
        WITH like_row_numbers AS
        (SELECT
          post_id,
          created_at,
          user_id,
          ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) AS rn
        FROM post_likes
        WHERE post_id = ANY($1))
        SELECT
          post_id AS "postId",
          lrn.created_at AS "addedAt",
          user_id AS "userId",
          u.login
        FROM like_row_numbers AS lrn JOIN users AS u
          ON lrn.user_id = u.id
        WHERE lrn.rn <= $2
        ORDER BY post_id, lrn.created_at DESC
      `,
      [postIds, newestLikesNumber],
    );

    return result.rows;
  }
}
