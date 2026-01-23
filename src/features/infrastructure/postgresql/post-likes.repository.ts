import { Inject, Injectable } from '@nestjs/common';
import { LikeStatus } from '../../../types/likes.types.js';
import { pool } from '../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class PostLikesRepository {
  constructor(@Inject(pool) private readonly pool: Pool) {}

  async deleteLikesInfo(postId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM post_likes WHERE post_id = $1', [parseInt(postId)]);
      await client.query('DELETE FROM post_dislikes WHERE post_id = $1', [parseInt(postId)]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
