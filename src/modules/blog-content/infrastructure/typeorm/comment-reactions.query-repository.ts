import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GetCommentLikesInfoParams, LikesInfoViewModel, LikeStatus } from '../../types/likes.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { CommentDislike } from './entities/comment-dislike.entity.js';
import { CommentLike } from './entities/comment-like.entity.js';

@Injectable()
export class CommentReactionsQueryRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(CommentLike) private readonly commentLikesEntityRepository: Repository<CommentLike>,
    @InjectRepository(CommentDislike)
    private readonly commentDislikesEntityRepository: Repository<CommentDislike>,
  ) {}

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
    return this.commentLikesEntityRepository
      .createQueryBuilder('commentLike')
      .select('commentLike.commentId', 'commentId')
      .addSelect('COUNT(commentLike.userId)::int', 'likesCount')
      .where('commentLike.commentId = ANY(:commentIds)', { commentIds })
      .groupBy('commentLike.commentId')
      .getRawMany<{ commentId: number; likesCount: number }>();
  }

  private async getDislikesCount(
    commentIds: number[],
  ): Promise<{ commentId: number; dislikesCount: number }[]> {
    return this.commentDislikesEntityRepository
      .createQueryBuilder('commentDislike')
      .select('commentDislike.commentId', 'commentId')
      .addSelect('COUNT(commentDislike.userId)::int', 'dislikesCount')
      .where('commentDislike.commentId = ANY(:commentIds)', { commentIds })
      .groupBy('commentDislike.commentId')
      .getRawMany<{ commentId: number; dislikesCount: number }>();
  }

  private async getLikeStatus(
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

    const dislikes = await this.commentDislikesEntityRepository
      .createQueryBuilder('commentDislike')
      .select('commentDislike.commentId', 'commentId')
      .where('commentDislike.userId = :userId', { userId: userIdNum })
      .andWhere('commentDislike.commentId IN (:...commentIds)', { commentIds })
      .getRawMany<{ commentId: number }>();

    const likes = await this.commentLikesEntityRepository
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
}
