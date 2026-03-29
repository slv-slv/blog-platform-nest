import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GetSingleCommentLikesInfoParams, LikesInfoViewModel, LikeStatus } from '../../types/likes.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { CommentDislike, CommentLike } from './comment-likes.entities.js';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(CommentLike) private readonly commentLikesEntityRepository: Repository<CommentLike>,
    @InjectRepository(CommentDislike)
    private readonly commentDislikesEntityRepository: Repository<CommentDislike>,
  ) {}

  async getLikesInfo(params: GetSingleCommentLikesInfoParams): Promise<LikesInfoViewModel> {
    const { commentId } = params;
    const userId = params.userId ?? null;

    if (!isPositiveIntegerString(commentId)) {
      return { likesCount: 0, dislikesCount: 0, myStatus: LikeStatus.None };
    }

    const commentIdNum = +commentId;
    const likesCount = (await this.getLikesCount([commentIdNum]))[0]?.likesCount ?? 0;
    const dislikesCount = (await this.getDislikesCount([commentIdNum]))[0]?.dislikesCount ?? 0;
    const myStatus = (await this.getLikeStatus([commentIdNum], userId))[0]?.myStatus ?? LikeStatus.None;

    return { likesCount, dislikesCount, myStatus };
  }

  private async getLikesCount(commentIds: number[]): Promise<{ commentId: number; likesCount: number }[]> {
    return await this.commentLikesEntityRepository
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
    return await this.commentDislikesEntityRepository
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
}
