import { Inject, Injectable } from '@nestjs/common';
import { ExtendedLikesInfoViewType } from '../../../types/likes.types.js';
import { PostLikesRepository } from './post-likes.repository.js';
import { SETTINGS } from '../../../../../../settings.js';
import { InjectModel } from '@nestjs/mongoose';
import { PostLikes } from './post-likes.schemas.js';
import { PostLikesType } from '../../post-likes.types.js';
import { Model } from 'mongoose';
import { UsersQueryRepository } from '../../../../../user-accounts/users/infrastructure/mongoose/users.query-repository.js';
import { pool } from '../../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @InjectModel(PostLikes.name) private readonly model: Model<PostLikesType>,
    @Inject(pool) private readonly pool: Pool,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  // async getLikesInfo(postId: string, userId: string): Promise<ExtendedLikesInfoViewType> {
  //   const likesCount = await this.postLikesRepository.getLikesCount(postId);
  //   const dislikesCount = await this.postLikesRepository.getDislikesCount(postId);
  //   const myStatus = await this.postLikesRepository.getLikeStatus(postId, userId);

  //   const newestLikesNumber = SETTINGS.NEWEST_LIKES_NUMBER;

  //   const result = await this.model.aggregate([
  //     { $match: { postId } },
  //     { $unwind: '$likes' },
  //     { $sort: { 'likes.createdAt': -1 } },
  //     { $limit: newestLikesNumber },
  //     {
  //       $group: {
  //         _id: '$_id',
  //         likes: { $push: '$likes' },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         likes: 1,
  //       },
  //     },
  //   ]);

  //   const post = result[0];

  //   const newestLikes = post
  //     ? await Promise.all(
  //         post.likes.map(async (like: { userId: string; createdAt: Date }) => {
  //           const addedAt = like.createdAt.toISOString();
  //           const userId = like.userId;

  //           const user = await this.usersQueryRepository.getCurrentUser(userId);
  //           const login = user?.login;

  //           return { addedAt, userId, login };
  //         }),
  //       )
  //     : [];

  //   return { likesCount, dislikesCount, myStatus, newestLikes };
  // }

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
