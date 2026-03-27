import { Inject, Injectable } from '@nestjs/common';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import { CommentLikeStatusRepoParams } from '../../types/comment-likes.types.js';
import { GetSingleCommentLikesInfoParams, LikesInfoViewModel, LikeStatus } from '../../types/likes.types.js';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async getLikesInfo(params: GetSingleCommentLikesInfoParams): Promise<LikesInfoViewModel> {
    const { commentId } = params;
    const userId = params.userId ?? null;
    const likesCount = await this.getLikesCount(commentId);
    const dislikesCount = await this.getDislikesCount(commentId);
    const myStatus = await this.getLikeStatus({ commentId, userId });

    return { likesCount, dislikesCount, myStatus };
  }

  private async getLikesCount(commentId: string): Promise<number> {
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

  private async getDislikesCount(commentId: string): Promise<number> {
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

  private async getLikeStatus(params: CommentLikeStatusRepoParams): Promise<LikeStatus> {
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
}
