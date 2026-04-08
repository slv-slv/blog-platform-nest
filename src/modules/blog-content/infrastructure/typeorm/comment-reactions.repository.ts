import { Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SetCommentLikeRepoParams, SetCommentNoneRepoParams } from '../../types/comment-likes.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { CommentDislike } from './entities/comment-dislike.entity.js';
import { CommentLike } from './entities/comment-like.entity.js';

@Injectable()
export class CommentReactionsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getLikeStatus(
    commentIds: number[],
    userId: string | null,
  ): Promise<{ commentId: number; myStatus: LikeStatus }[]> {
    if (commentIds.length === 0) {
      return [];
    }

    if (userId === null || !isPositiveIntegerString(userId)) {
      return commentIds.map((commentId) => ({ commentId, myStatus: LikeStatus.None }));
    }

    const userIdNum = +userId;
    const commentLikesRepository = this.dataSource.getRepository(CommentLike);
    const commentDislikesRepository = this.dataSource.getRepository(CommentDislike);

    const dislikes = await commentDislikesRepository
      .createQueryBuilder('commentDislike')
      .select('commentDislike.commentId', 'commentId')
      .where('commentDislike.userId = :userId', { userId: userIdNum })
      .andWhere('commentDislike.commentId IN (:...commentIds)', { commentIds })
      .getRawMany<{ commentId: number }>();

    const likes = await commentLikesRepository
      .createQueryBuilder('commentLike')
      .select('commentLike.commentId', 'commentId')
      .where('commentLike.userId = :userId', { userId: userIdNum })
      .andWhere('commentLike.commentId IN (:...commentIds)', { commentIds })
      .getRawMany<{ commentId: number }>();

    const statusesMap = new Map<number, LikeStatus>(
      commentIds.map((commentId) => [commentId, LikeStatus.None]),
    );

    for (const { commentId } of dislikes) {
      statusesMap.set(commentId, LikeStatus.Dislike);
    }

    for (const { commentId } of likes) {
      statusesMap.set(commentId, LikeStatus.Like);
    }

    return commentIds.map((commentId) => ({
      commentId,
      myStatus: statusesMap.get(commentId)!,
    }));
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
