import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ExtendedLikesInfoViewModel, GetPostLikesInfoParams, LikeStatus } from '../../types/likes.types.js';
import { coreConfig } from '../../../../config/core.config.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PostDislike, PostLike } from './post-likes.entities.js';
import { User } from '../../../user-accounts/infrastructure/typeorm/users.entities.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PostLike) private readonly postLikesEntityRepository: Repository<PostLike>,
    @InjectRepository(PostDislike) private readonly postDislikesEntityRepository: Repository<PostDislike>,
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
    return await this.postLikesEntityRepository
      .createQueryBuilder('postLike')
      .select('postLike.postId', 'postId')
      .addSelect('COUNT(postLike.userId)::int', 'likesCount')
      .where('postLike.postId = ANY(:postIds)', { postIds })
      .groupBy('postLike.postId')
      .getRawMany<{ postId: number; likesCount: number }>();
  }

  private async getDislikesCount(postIds: number[]): Promise<{ postId: number; dislikesCount: number }[]> {
    return await this.postDislikesEntityRepository
      .createQueryBuilder('postDislike')
      .select('postDislike.postId', 'postId')
      .addSelect('COUNT(postDislike.userId)::int', 'dislikesCount')
      .where('postDislike.postId = ANY(:postIds)', { postIds })
      .groupBy('postDislike.postId')
      .getRawMany<{ postId: number; dislikesCount: number }>();
  }

  private async getLikeStatus(
    postIds: number[],
    userId: string | null,
  ): Promise<{ postId: number; myStatus: LikeStatus }[]> {
    if (userId === null || !isPositiveIntegerString(userId)) {
      return postIds.map((postId) => ({ postId, myStatus: LikeStatus.None }));
    }

    const userIdNum = +userId;

    return await this.dataSource
      .createQueryBuilder()
      .select('p."postId"', 'postId')
      .addSelect(
        `
            CASE
              WHEN postLike.userId IS NOT NULL THEN 'Like'
              WHEN postDislike.userId IS NOT NULL THEN 'Dislike'
              ELSE 'None'
            END
          `,
        'myStatus',
      )
      .from('unnest(:postIds::int[])', 'p(postId)')
      .leftJoin(PostLike, 'postLike', 'p."postId" = postLike.postId AND postLike.userId = :userId')
      .leftJoin(
        PostDislike,
        'postDislike',
        'p."postId" = postDislike.postId AND postDislike.userId = :userId',
      )
      .setParameters({ postIds, userId: userIdNum })
      .getRawMany<{ postId: number; myStatus: LikeStatus }>();
  }

  private async getNewestLikes(
    postIds: number[],
  ): Promise<{ postId: number; addedAt: Date; userId: number; login: string }[]> {
    const newestLikesNumber = this.core.newestLikesNumber;

    const likeRowNumbersQuery = this.postLikesEntityRepository
      .createQueryBuilder('postLike')
      .select('postLike.postId', 'postId')
      .addSelect('postLike.createdAt', 'createdAt')
      .addSelect('postLike.userId', 'userId')
      .addSelect('ROW_NUMBER() OVER (PARTITION BY postLike.postId ORDER BY postLike.createdAt DESC)', 'rn')
      .where('postLike.postId = ANY(:postIds)', { postIds });

    return await this.dataSource
      .createQueryBuilder()
      .addCommonTableExpression(likeRowNumbersQuery, 'LikeRowNumbers')
      .select('lrn."postId"', 'postId')
      .addSelect('lrn."createdAt"', 'addedAt')
      .addSelect('lrn."userId"', 'userId')
      .addSelect('user.login', 'login')
      .from('LikeRowNumbers', 'lrn')
      .innerJoin(User, 'user', 'lrn."userId" = user.id')
      .where('lrn.rn <= :newestLikesNumber', { newestLikesNumber })
      .orderBy('lrn."postId"', 'ASC')
      .addOrderBy('lrn."createdAt"', 'DESC')
      .getRawMany<{ postId: number; addedAt: Date; userId: number; login: string }>();
  }
}
