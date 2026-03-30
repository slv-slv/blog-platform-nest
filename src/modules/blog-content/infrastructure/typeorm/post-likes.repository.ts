import { Injectable } from '@nestjs/common';
import { LikeStatus } from '../../types/likes.types.js';
import { SetPostLikeRepoParams, SetPostNoneRepoParams } from '../../types/post-likes.types.js';
import { PostDislike, PostLike } from './post-likes.entities.js';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class PostLikesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getLikeStatus(
    postIds: number[],
    userId: string | null,
  ): Promise<{ postId: number; myStatus: LikeStatus }[]> {
    if (postIds.length === 0) {
      return [];
    }

    if (userId === null || !isPositiveIntegerString(userId)) {
      return postIds.map((postId) => ({ postId, myStatus: LikeStatus.None }));
    }

    const userIdNum = +userId;
    const postLikesRepository = this.dataSource.getRepository(PostLike);
    const postDislikesRepository = this.dataSource.getRepository(PostDislike);

    const dislikes = await postDislikesRepository
      .createQueryBuilder('postDislike')
      .select('postDislike.postId', 'postId')
      .where('postDislike.userId = :userId', { userId: userIdNum })
      .andWhere('postDislike.postId IN (:...postIds)', { postIds })
      .getRawMany<{ postId: number }>();

    const likes = await postLikesRepository
      .createQueryBuilder('postLike')
      .select('postLike.postId', 'postId')
      .where('postLike.userId = :userId', { userId: userIdNum })
      .andWhere('postLike.postId IN (:...postIds)', { postIds })
      .getRawMany<{ postId: number }>();

    const statusesMap = new Map<number, LikeStatus>(postIds.map((postId) => [postId, LikeStatus.None]));

    for (const { postId } of dislikes) {
      statusesMap.set(postId, LikeStatus.Dislike);
    }

    for (const { postId } of likes) {
      statusesMap.set(postId, LikeStatus.Like);
    }

    return postIds.map((postId) => ({
      postId,
      myStatus: statusesMap.get(postId)!,
    }));
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
      const postLikesRepository = manager.getRepository(PostLike);
      const postDislikesRepository = manager.getRepository(PostDislike);

      await postLikesRepository.delete({ postId: postIdNum, userId: userIdNum });
      await postDislikesRepository.delete({ postId: postIdNum, userId: userIdNum });
    });
  }
}
