import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LikeStatus } from '../../types/likes.types.js';
import { SetPostLikeRepoParams, SetPostNoneRepoParams } from '../../types/post-likes.types.js';
import { PostDislike, PostLike } from './post-likes.entities.js';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { coreConfig } from '../../../../config/core.config.js';
import { User } from '../../../user-accounts/infrastructure/typeorm/users.entities.js';

@Injectable()
export class PostLikesRepository {
  constructor(
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PostLike) private readonly postLikesEntityRepository: Repository<PostLike>,
    @InjectRepository(PostDislike) private readonly postDislikesEntityRepository: Repository<PostDislike>,
  ) {}

  async getLikesCount(postIdArr: number[]): Promise<{ postId: number; likesCount: number }[]> {
    return await this.postLikesEntityRepository
      .createQueryBuilder('postLike')
      .select('postLike.postId', 'postId')
      .addSelect('COUNT(postLike.userId)::int', 'likesCount')
      .where('postLike.postId = ANY(:postIdArr)', { postIdArr })
      .groupBy('postLike.postId')
      .getRawMany<{ postId: number; likesCount: number }>();
  }

  async getDislikesCount(postIdArr: number[]): Promise<{ postId: number; dislikesCount: number }[]> {
    return await this.postDislikesEntityRepository
      .createQueryBuilder('postDislike')
      .select('postDislike.postId', 'postId')
      .addSelect('COUNT(postDislike.userId)::int', 'dislikesCount')
      .where('postDislike.postId = ANY(:postIdArr)', { postIdArr })
      .groupBy('postDislike.postId')
      .getRawMany<{ postId: number; dislikesCount: number }>();
  }

  async getLikeStatus(
    postIdArr: number[],
    userId: string | null,
  ): Promise<{ postId: number; myStatus: LikeStatus }[]> {
    if (userId === null || !isPositiveIntegerString(userId)) {
      return postIdArr.map((postId) => ({ postId, myStatus: LikeStatus.None }));
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
      .from('unnest(:postIdArr::int[])', 'p(postId)')
      .leftJoin(PostLike, 'postLike', 'p."postId" = postLike.postId AND postLike.userId = :userId')
      .leftJoin(
        PostDislike,
        'postDislike',
        'p."postId" = postDislike.postId AND postDislike.userId = :userId',
      )
      .setParameters({ postIdArr, userIdNum })
      .getRawMany<{ postId: number; myStatus: LikeStatus }>();
  }

  async getNewestLikes(
    postIdArr: number[],
  ): Promise<{ postId: number; addedAt: Date; userId: number; login: string }[]> {
    const newestLikesNumber = this.core.newestLikesNumber;

    const likeRowNumbersQuery = this.postLikesEntityRepository
      .createQueryBuilder('postLike')
      .select('postLike.postId', 'postId')
      .addSelect('postLike.createdAt', 'createdAt')
      .addSelect('postLike.userId', 'userId')
      .addSelect('ROW_NUMBER() OVER (PARTITION BY postLike.postId ORDER BY postLike.createdAt DESC)', 'rn')
      .where('postLike.postId = ANY(:postIdArr)', { postIdArr });

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

  async setLike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;

    if (!isPositiveIntegerString(postId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const postIdNum = +postId;
    const userIdNum = +userId;

    await this.dataSource.transaction(async (manager) => {
      const postDislikesRepository = manager.getRepository(PostDislike);
      const postLikesRepository = manager.getRepository(PostLike);

      await postDislikesRepository.delete({ postId: postIdNum, userId: userIdNum });
      await postLikesRepository.upsert({ postId: postIdNum, userId: userIdNum, createdAt }, [
        'postId',
        'userId',
      ]);
    });
  }

  async setDislike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;

    if (!isPositiveIntegerString(postId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const postIdNum = +postId;
    const userIdNum = +userId;

    await this.dataSource.transaction(async (manager) => {
      const postLikesRepository = manager.getRepository(PostLike);
      const postDislikesRepository = manager.getRepository(PostDislike);

      await postLikesRepository.delete({ postId: postIdNum, userId: userIdNum });
      await postDislikesRepository.upsert({ postId: postIdNum, userId: userIdNum, createdAt }, [
        'postId',
        'userId',
      ]);
    });
  }

  async setNone(params: SetPostNoneRepoParams): Promise<void> {
    const { postId, userId } = params;

    if (!isPositiveIntegerString(postId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const postIdNum = +postId;
    const userIdNum = +userId;

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
      );
      await manager.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
      );
    });
  }
}
