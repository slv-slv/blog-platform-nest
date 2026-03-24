import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GetCommentLikesInfoParams, LikeStatus, LikesInfoViewType } from '../../types/likes.types.js';
import { CommentLikes } from './comment-likes.schemas.js';
import { Model } from 'mongoose';
import { CommentLikesType } from '../../types/comment-likes.types.js';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(@InjectModel(CommentLikes.name) private readonly model: Model<CommentLikesType>) {}

  async getLikesInfo(params: GetCommentLikesInfoParams<string>): Promise<Map<string, LikesInfoViewType>> {
    const { commentIds: commentIdArr } = params;
    const userId = params.userId ?? null;
    const likesCountArr = await this.getLikesCount(commentIdArr);
    const likesCountMap = new Map(
      likesCountArr.map(({ commentId, likesCount }) => [commentId, likesCount]),
    );

    const dislikesCountArr = await this.getDislikesCount(commentIdArr);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ commentId, dislikesCount }) => [commentId, dislikesCount]),
    );

    const myStatusArr = await this.getLikeStatus(commentIdArr, userId);
    const myStatusMap = new Map(myStatusArr.map(({ commentId, myStatus }) => [commentId, myStatus]));

    const likesInfoMap = new Map<string, LikesInfoViewType>();
    for (const commentId of commentIdArr) {
      likesInfoMap.set(commentId, {
        likesCount: likesCountMap.get(commentId) ?? 0,
        dislikesCount: dislikesCountMap.get(commentId) ?? 0,
        myStatus: myStatusMap.get(commentId) ?? LikeStatus.None,
      });
    }

    return likesInfoMap;
  }

  private async getLikesCount(commentIdArr: string[]): Promise<{ commentId: string; likesCount: number }[]> {
    if (commentIdArr.length === 0) {
      return [];
    }

    return this.model.aggregate<{ commentId: string; likesCount: number }>([
      { $match: { commentId: { $in: commentIdArr } } },
      {
        $project: {
          _id: 0,
          commentId: 1,
          likesCount: { $size: '$likes' },
        },
      },
    ]);
  }

  private async getDislikesCount(
    commentIdArr: string[],
  ): Promise<{ commentId: string; dislikesCount: number }[]> {
    if (commentIdArr.length === 0) {
      return [];
    }

    return this.model.aggregate<{ commentId: string; dislikesCount: number }>([
      { $match: { commentId: { $in: commentIdArr } } },
      {
        $project: {
          _id: 0,
          commentId: 1,
          dislikesCount: { $size: '$dislikes' },
        },
      },
    ]);
  }

  private async getLikeStatus(
    commentIdArr: string[],
    userId: string | null,
  ): Promise<{ commentId: string; myStatus: LikeStatus }[]> {
    if (commentIdArr.length === 0) {
      return [];
    }

    if (userId === null) {
      return commentIdArr.map((commentId) => ({ commentId, myStatus: LikeStatus.None }));
    }

    return this.model.aggregate<{ commentId: string; myStatus: LikeStatus }>([
      { $match: { commentId: { $in: commentIdArr } } },
      {
        $project: {
          _id: 0,
          commentId: 1,
          myStatus: {
            $switch: {
              branches: [
                { case: { $in: [userId, '$likes.userId'] }, then: LikeStatus.Like },
                { case: { $in: [userId, '$dislikes.userId'] }, then: LikeStatus.Dislike },
              ],
              default: LikeStatus.None,
            },
          },
        },
      },
    ]);
  }
}
