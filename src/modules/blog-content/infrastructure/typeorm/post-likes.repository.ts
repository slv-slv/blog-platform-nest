import { Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import {
  PostLikeStatusRepoParams,
  SetPostLikeRepoParams,
  SetPostNoneRepoParams,
} from '../../types/post-likes.types.js';
import { PostDislike, PostLike } from './post-likes.entities.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PostLikesRepository {
  constructor(
    @InjectRepository(PostLike) private readonly postLikesEntityRepository: Repository<PostLike>,
    @InjectRepository(PostDislike) private readonly postDislikesEntityRepository: Repository<PostDislike>,
  ) {}

  async getLikesCount(postIdArr: number[]): Promise<{ postId: number; likesCount: number }[]> {
    const result = await this.postLikesEntityRepository
      .createQueryBuilder('postLike')
      .select('postLike.postId', 'postId')
      .addSelect('COUNT(postLike.userId)::int', 'likesCount')
      .where('postLike.postId = ANY(:postIdArr)', { postIdArr })
      .groupBy('postLike.postId')
      .getRawMany();

    return result;
  }

  async getDislikesCount(postIdArr: number[]): Promise<{ postId: number; dislikesCount: number }[]> {
    const result = await this.postDislikesEntityRepository
      .createQueryBuilder('postDislike')
      .select('postDislike.postId', 'postId')
      .addSelect('COUNT(postDislike.userId)::int', 'dislikesCount')
      .where('postDislike.postId = ANY(:postIdArr)', { postIdArr })
      .groupBy('postDislike.postId')
      .getRawMany();

    return result;
  }

  async getLikeStatus(params: PostLikeStatusRepoParams): Promise<LikeStatus> {
    const { postId, userId } = params;
    if (userId === null) return LikeStatus.None;

    const likeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM post_likes
        WHERE post_id = $1::int AND user_id = $2::int
      `,
      [postId, userId],
    );

    if (likeResult.rows[0].count > 0) return LikeStatus.Like;

    const dislikeResult = await this.pool.query(
      `
        SELECT COUNT(*)::int
        FROM post_dislikes
        WHERE post_id = $1::int AND user_id = $2::int
      `,
      [postId, userId],
    );

    if (dislikeResult.rows[0].count > 0) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  // async deleteLikesInfo(postId: string): Promise<void> {
  //   const client = await this.pool.connect();
  //   try {
  //     await client.query('BEGIN');
  //     await client.query('DELETE FROM post_likes WHERE post_id = $1', [parseInt(postId)]);
  //     await client.query('DELETE FROM post_dislikes WHERE post_id = $1', [parseInt(postId)]);
  //     await client.query('COMMIT');
  //   } catch (e) {
  //     await client.query('ROLLBACK');
  //     throw e;
  //   } finally {
  //     client.release();
  //   }
  // }

  async setLike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1::int AND user_id = $2::int
        `,
        [postId, userId],
      );
      await client.query(
        `
          INSERT INTO post_likes (post_id, user_id, created_at)
          VALUES ($1::int, $2::int, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [postId, userId, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  async setDislike(params: SetPostLikeRepoParams): Promise<void> {
    const { postId, userId, createdAt } = params;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1::int AND user_id = $2::int
        `,
        [postId, userId],
      );
      await client.query(
        `
          INSERT INTO post_dislikes (post_id, user_id, created_at)
          VALUES ($1::int, $2::int, $3)
          ON CONFLICT (post_id, user_id) DO UPDATE
          SET created_at = EXCLUDED.created_at
        `,
        [postId, userId, createdAt],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }

  async setNone(params: SetPostNoneRepoParams): Promise<void> {
    const { postId, userId } = params;

    const client = await this.pool.connect();
    try {
      await client.query(`BEGIN`);
      await client.query(
        `
          DELETE FROM post_likes
          WHERE post_id = $1::int AND user_id = $2::int
        `,
        [postId, userId],
      );
      await client.query(
        `
          DELETE FROM post_dislikes
          WHERE post_id = $1::int AND user_id = $2::int
        `,
        [postId, userId],
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    } finally {
      client.release();
    }
  }
}
