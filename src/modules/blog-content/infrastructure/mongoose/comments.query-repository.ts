import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Comment } from './comments.schemas.js';
import { CommentsPaginatedType, CommentViewType } from '../../types/comments.types.js';
import { CommentLikesQueryRepository } from './comment-likes.query-repository.js';
import { PagingParamsType } from '../../../../common/types/paging-params.types.js';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private readonly model: Model<Comment>,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  async findComment(id: string, userId: string): Promise<CommentViewType | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const comment = await this.model.findOne({ _id }, { _id: 0, postId: 0 }).lean();
    if (!comment) {
      return null;
    }

    const likesInfo = await this.commentLikesQueryRepository.getLikesInfo(id, userId);

    return { id, ...comment, likesInfo };
  }

  async getComments(
    postId: string,
    userId: string,
    pagingParams: PagingParamsType,
  ): Promise<CommentsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const totalCount = await this.model.countDocuments({ postId });
    const pagesCount = Math.ceil(totalCount / pageSize);

    const commentsWithObjectId = await this.model
      .find({ postId }, { postId: 0 })
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    // const commentIds = commentsWithObjectId.map((comment) => comment._id.toString());

    const comments = await Promise.all(
      commentsWithObjectId.map(async (comment) => {
        return {
          id: comment._id.toString(),
          content: comment.content,
          commentatorInfo: comment.commentatorInfo,
          createdAt: comment.createdAt,
          likesInfo: await this.commentLikesQueryRepository.getLikesInfo(comment._id.toString(), userId),
        };
      }),
    );

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: comments,
    };
  }
}
