import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ExtendedLikesInfoViewType, GetPostLikesInfoParams, LikeStatus } from '../../types/likes.types.js';
import { PostLikesRepository } from './post-likes.repository.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import { coreConfig } from '../../../../config/core.config.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}

  async getLikesInfo(params: GetPostLikesInfoParams<number>): Promise<Map<number, ExtendedLikesInfoViewType>> {
    const { postIds: postIdArr } = params;
    const userId = params.userId ?? null;
    const likesCountArr = await this.postLikesRepository.getLikesCount(postIdArr);
    const likesCountMap = new Map(likesCountArr.map(({ postId, likesCount }) => [postId, likesCount]));

    const dislikesCountArr = await this.postLikesRepository.getDislikesCount(postIdArr);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ postId, dislikesCount }) => [postId, dislikesCount]),
    );

    const myStatusArr = await this.postLikesRepository.getLikeStatus(postIdArr, userId);
    const myStatusMap = new Map(myStatusArr.map(({ postId, myStatus }) => [postId, myStatus]));

    const newestLikesArr = await this.postLikesRepository.getNewestLikes(postIdArr);
    const newestLikesMap = new Map<number, { addedAt: string; userId: string; login: string }[]>();
    for (const row of newestLikesArr) {
      const like = newestLikesMap.get(row.postId) ?? [];
      like.push({ addedAt: row.addedAt.toISOString(), userId: row.userId.toString(), login: row.login });
      newestLikesMap.set(row.postId, like);
    }

    const likesInfoMap = new Map<number, ExtendedLikesInfoViewType>();
    for (const postId of postIdArr) {
      likesInfoMap.set(postId, {
        likesCount: likesCountMap.get(postId) ?? 0,
        dislikesCount: dislikesCountMap.get(postId) ?? 0,
        myStatus: myStatusMap.get(postId) ?? LikeStatus.None,
        newestLikes: newestLikesMap.get(postId) ?? [],
      });
    }

    return likesInfoMap;
  }
}
