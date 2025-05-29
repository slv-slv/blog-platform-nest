import { Inject, Injectable } from '@nestjs/common';
import { ExtendedLikesInfoViewType } from '../../../types/likes.types.js';
import { PostLikesRepository } from './post-likes.repository.js';
import { SETTINGS } from '../../../../../../settings.js';
import { UsersQueryRepository } from '../../../../../user-accounts/users/repositories/postgresql/users.query-repository.js';
import { pool } from '../../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async getLikesInfo(postId: string, userId: string): Promise<ExtendedLikesInfoViewType> {
    const likesCount = await this.postLikesRepository.getLikesCount(postId);
    const dislikesCount = await this.postLikesRepository.getDislikesCount(postId);
    const myStatus = await this.postLikesRepository.getLikeStatus(postId, userId);

    const newestLikesNumber = SETTINGS.NEWEST_LIKES_NUMBER;

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
