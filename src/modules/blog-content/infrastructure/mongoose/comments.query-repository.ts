import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Comment } from './comments.schemas.js';
import {
  CommentsPaginatedType,
  CommentViewType,
  FindCommentRepoQueryParams,
  GetCommentsRepoQueryParams,
} from '../../types/comments.types.js';
import { CommentLikesQueryRepository } from './comment-likes.query-repository.js';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private readonly model: Model<Comment>,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  async findComment(params: FindCommentRepoQueryParams): Promise<CommentViewType | null> {
    const { commentId: id, userId } = params;
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const comment = await this.model.findOne({ _id }, { _id: 0, postId: 0 }).lean();
    if (!comment) {
      return null;
    }

    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({ commentIds: [id], userId });

    return { id, ...comment, likesInfo: likesInfoMap.get(id)! };
  }

  async getComments(params: GetCommentsRepoQueryParams): Promise<CommentsPaginatedType> {
    const { postId, userId, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const totalCount = await this.model.countDocuments({ postId });
    const pagesCount = Math.ceil(totalCount / pageSize);

    const commentsWithObjectId = await this.model
      .find({ postId }, { postId: 0 })
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const commentIds = commentsWithObjectId.map((comment) => comment._id.toString());
    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({ commentIds, userId });

    const comments = commentsWithObjectId.map((comment) => {
      const commentId = comment._id.toString();

      return {
        id: commentId,
        content: comment.content,
        commentatorInfo: comment.commentatorInfo,
        createdAt: comment.createdAt,
        likesInfo: likesInfoMap.get(commentId)!,
      };
    });

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: comments,
    };
  }
}
