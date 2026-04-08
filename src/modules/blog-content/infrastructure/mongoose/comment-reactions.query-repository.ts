import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GetCommentLikesInfoParams, LikeStatus, LikesInfoViewModel } from '../../types/likes.types.js';
import { CommentReactions } from './comment-reactions.schemas.js';
import { Model } from 'mongoose';
import { CommentLikesModel } from '../../types/comment-likes.types.js';

@Injectable()
export class CommentReactionsQueryRepository {
  constructor(@InjectModel(CommentReactions.name) private readonly model: Model<CommentLikesModel>) {}

  async getLikesInfo(params: GetCommentLikesInfoParams<string>): Promise<Map<string, LikesInfoViewModel>> {
    const { commentIds, userId = null } = params;
    const likesCountArr = await this.getLikesCount(commentIds);
    const likesCountMap = new Map(likesCountArr.map(({ commentId, likesCount }) => [commentId, likesCount]));

    const dislikesCountArr = await this.getDislikesCount(commentIds);
    const dislikesCountMap = new Map(
      dislikesCountArr.map(({ commentId, dislikesCount }) => [commentId, dislikesCount]),
    );

    const myStatusArr = await this.getLikeStatus(commentIds, userId);
    const myStatusMap = new Map(myStatusArr.map(({ commentId, myStatus }) => [commentId, myStatus]));

    const likesInfoMap = new Map<string, LikesInfoViewModel>();
    for (const commentId of commentIds) {
      likesInfoMap.set(commentId, {
        likesCount: likesCountMap.get(commentId) ?? 0,
        dislikesCount: dislikesCountMap.get(commentId) ?? 0,
        myStatus: myStatusMap.get(commentId) ?? LikeStatus.None,
      });
    }

    return likesInfoMap;
  }

  private async getLikesCount(commentIds: string[]): Promise<{ commentId: string; likesCount: number }[]> {
    if (commentIds.length === 0) {
      return [];
    }

    return this.model.aggregate<{ commentId: string; likesCount: number }>([
      { $match: { commentId: { $in: commentIds } } },
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
    commentIds: string[],
  ): Promise<{ commentId: string; dislikesCount: number }[]> {
    if (commentIds.length === 0) {
      return [];
    }

    return this.model.aggregate<{ commentId: string; dislikesCount: number }>([
      { $match: { commentId: { $in: commentIds } } },
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
    commentIds: string[],
    userId: string | null,
  ): Promise<{ commentId: string; myStatus: LikeStatus }[]> {
    if (commentIds.length === 0) {
      return [];
    }

    if (userId === null) {
      return commentIds.map((commentId) => ({ commentId, myStatus: LikeStatus.None }));
    }

    return this.model.aggregate<{ commentId: string; myStatus: LikeStatus }>([
      { $match: { commentId: { $in: commentIds } } },
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
