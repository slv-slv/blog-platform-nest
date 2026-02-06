import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ExtendedLikesInfoViewType } from '../../types/likes.types.js';
import { PostLikesRepository } from './post-likes.repository.js';
import { UsersQueryRepository } from '../../../user-accounts/infrastructure/sql/users.query-repository.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import { coreConfig } from '../../../../config/core.config.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
  ) {}

  async getLikesInfo(postId: string, userId: string | null): Promise<ExtendedLikesInfoViewType> {
    const likesCount = await this.postLikesRepository.getLikesCount(postId);
    const dislikesCount = await this.postLikesRepository.getDislikesCount(postId);
    const myStatus = await this.postLikesRepository.getLikeStatus(postId, userId);

    const newestLikesNumber = this.core.newestLikesNumber;

    const result = await this.pool.query(
      `
        SELECT
          post_likes.created_at,
          post_likes.user_id,
          users.login
        FROM post_likes JOIN users
          ON post_likes.user_id = users.id
        WHERE post_likes.post_id = $1
        ORDER BY post_likes.created_at DESC
        LIMIT $2
      `,
      [parseInt(postId), newestLikesNumber],
    );

    const newestLikes = result.rows.map((like) => ({
      addedAt: like.created_at,
      userId: like.user_id.toString(),
      login: like.login,
    }));

    return { likesCount, dislikesCount, myStatus, newestLikes };
  }
}
