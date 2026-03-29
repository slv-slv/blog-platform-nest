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

    await this.dataSource.transaction(async (manager) => {
      const commentDislikesRepository = manager.getRepository(CommentDislike);
      const commentLikesRepository = manager.getRepository(CommentLike);

      await commentDislikesRepository.delete({ commentId: commentIdNum, userId: userIdNum });
      await commentLikesRepository.upsert({ commentId: commentIdNum, userId: userIdNum, createdAt }, [
        'commentId',
        'userId',
      ]);
    });
  }

  async setDislike(params: SetCommentLikeRepoParams): Promise<void> {
    const { commentId, userId, createdAt } = params;

    if (!isPositiveIntegerString(commentId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const commentIdNum = +commentId;
    const userIdNum = +userId;

    await this.dataSource.transaction(async (manager) => {
      const commentLikesRepository = manager.getRepository(CommentLike);
      const commentDislikesRepository = manager.getRepository(CommentDislike);

      await commentLikesRepository.delete({ commentId: commentIdNum, userId: userIdNum });
      await commentDislikesRepository.upsert({ commentId: commentIdNum, userId: userIdNum, createdAt }, [
        'commentId',
        'userId',
      ]);
    });
  }

  async setNone(params: SetCommentNoneRepoParams): Promise<void> {
    const { commentId, userId } = params;

    if (!isPositiveIntegerString(commentId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const commentIdNum = +commentId;
    const userIdNum = +userId;

    await this.dataSource.transaction(async (manager) => {
      const commentLikesRepository = manager.getRepository(CommentLike);
      const commentDislikesRepository = manager.getRepository(CommentDislike);

      await commentLikesRepository.delete({ commentId: commentIdNum, userId: userIdNum });
      await commentDislikesRepository.delete({ commentId: commentIdNum, userId: userIdNum });
    });
  }
}
