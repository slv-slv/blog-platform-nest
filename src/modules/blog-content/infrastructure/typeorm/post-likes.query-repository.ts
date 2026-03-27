import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ExtendedLikesInfoViewModel, GetSinglePostLikesInfoParams, LikeStatus } from '../../types/likes.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import { coreConfig } from '../../../../config/core.config.js';
import { PostLikeStatusRepoParams } from '../../types/post-likes.types.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
  ) {}

  async getLikesInfo(params: GetSinglePostLikesInfoParams): Promise<ExtendedLikesInfoViewModel> {
    const { postId } = params;
    const userId = params.userId ?? null;
    const likesCount = await this.getLikesCount(postId);
    const dislikesCount = await this.getDislikesCount(postId);
    const myStatus = await this.getLikeStatus({ postId, userId });

    const newestLikesNumber = this.core.newestLikesNumber;

    const result = await this.pool.query(
      `
        SELECT
          post_likes.created_at,
          post_likes.user_id,
          users.login
        FROM post_likes JOIN users
          ON post_likes.user_id = users.id
        WHERE post_likes.post_id = $1::int
        ORDER BY post_likes.created_at DESC
        LIMIT $2
      `,
      [postId, newestLikesNumber],
    );

    const newestLikes = result.rows.map((like) => ({
      addedAt: like.created_at,
      userId: like.user_id.toString(),
      login: like.login,
    }));

    return { likesCount, dislikesCount, myStatus, newestLikes };
  }

  private async getLikesCount(postId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM post_likes
        WHERE post_id = $1::int
      `,
      [postId],
    );

    return result.rows[0].count;
  }

  private async getDislikesCount(postId: string): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM post_dislikes
        WHERE post_id = $1::int
      `,
      [postId],
    );

    return result.rows[0].count;
  }

  private async getLikeStatus(params: PostLikeStatusRepoParams): Promise<LikeStatus> {
    const { postId, userId } = params;
    if (userId === null) return LikeStatus.None;

    const likeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM post_likes
        WHERE post_id = $1::int AND user_id = $2::int
      `,
      [postId, userId],
    );

    if (likeResult.rows[0].count > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM post_dislikes
        WHERE post_id = $1::int AND user_id = $2::int
      `,
      [postId, userId],
    );

    if (dislikeResult.rows[0].count > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }
}
