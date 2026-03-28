import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LikeStatus } from '../../types/likes.types.js';
import { SetPostLikeRepoParams, SetPostNoneRepoParams } from '../../types/post-likes.types.js';
import { PostDislike, PostLike } from './post-likes.entities.js';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { coreConfig } from '../../../../config/core.config.js';

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

    const result = await this.dataSource.query<
      { postId: number; addedAt: Date; userId: number; login: string }[]
    >(
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
          lrn.post_id AS "postId",
          lrn.created_at AS "addedAt",
          lrn.user_id AS "userId",
          u.login
        FROM like_row_numbers AS lrn JOIN users AS u
          ON lrn.user_id = u.id
        WHERE lrn.rn <= $2
        ORDER BY post_id, lrn.created_at DESC
      `,
      [postIdArr, newestLikesNumber],
    );

    return result;
  }

  async setLike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;

    if (!isPositiveIntegerString(postId) || !isPositiveIntegerString(userId)) {
      return;
    }

    const postIdNum = +postId;
    const userIdNum = +userId;

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
      );
      await manager.query(
        `
          INSERT INTO post_likes (post_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [postIdNum, userIdNum, createdAt],
      );
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
      await manager.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1 AND user_id = $2
        `,
        [postIdNum, userIdNum],
      );
      await manager.query(
        `
          INSERT INTO post_dislikes (post_id, user_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [postIdNum, userIdNum, createdAt],
      );
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
