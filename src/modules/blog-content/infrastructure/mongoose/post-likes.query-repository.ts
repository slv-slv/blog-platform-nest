import { Injectable } from '@nestjs/common';
import { PostLikesRepository } from './post-likes.repository.js';
import { ExtendedLikesInfoViewType, LikeStatus } from '../../types/likes.types.js';
import { UsersQueryRepository } from '../../../user-accounts/infrastructure/mongoose/users.query-repository.js';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    private readonly postLikesRepository: PostLikesRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async getLikesInfo(postIdArr: string[], userId: string | null): Promise<Map<string, ExtendedLikesInfoViewType>> {
    const likesCountArr = await this.postLikesRepository.getLikesCount(postIdArr);
    const likesCountMap = new Map(likesCountArr.map(({ postId, likesCount }) => [postId, likesCount]));

    const dislikesCountArr = await this.postLikesRepository.getDislikesCount(postIdArr);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ postId, dislikesCount }) => [postId, dislikesCount]),
    );

    const myStatusArr = await this.postLikesRepository.getLikeStatus(postIdArr, userId);
    const myStatusMap = new Map(myStatusArr.map(({ postId, myStatus }) => [postId, myStatus]));

    const newestLikesArr = await this.postLikesRepository.getNewestLikes(postIdArr);
    const userIds = [...new Set(newestLikesArr.map((row) => row.userId))];
    const userLoginMap = await this.usersQueryRepository.getUserLoginsMap(userIds);

    const newestLikesMap = new Map<string, { addedAt: string; userId: string; login: string }[]>();
    for (const row of newestLikesArr) {
      const likes = newestLikesMap.get(row.postId) ?? [];
      const login = userLoginMap.get(row.userId);

      if (!login) {
        continue;
      }

      likes.push({ addedAt: row.addedAt.toISOString(), userId: row.userId, login });
      newestLikesMap.set(row.postId, likes);
    }

    const likesInfoMap = new Map<string, ExtendedLikesInfoViewType>();
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
