import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Comment } from './comments.schemas.js';
import { CommentsPaginatedType, CommentViewType } from '../../comments.types.js';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import { CommentLikesQueryRepository } from '../../../likes/comments/infrastructure/mongoose/comment-likes.query-repository.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private readonly model: Model<Comment>,
    @Inject(pool) private readonly pool: Pool,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  // async findComment(id: string, userId: string): Promise<CommentViewType | null> {
  //   if (!ObjectId.isValid(id)) {
  //     return null;
  //   }
  //   const _id = new ObjectId(id);
  //   const comment = await this.model.findOne({ _id }, { _id: 0, postId: 0 }).lean();
  //   if (!comment) {
  //     return null;
  //   }

  //   const likesInfo = await this.commentLikesQueryRepository.getLikesInfo(id, userId);

  //   return { id, ...comment, likesInfo };
  // }

  async findComment(id: string, userId: string): Promise<CommentViewType | null> {
    const result = await this.pool.query(
      `
        SELECT
          comments.content,
          comments.created_at,
          comments.user_id AS commentator_id,
          users.login AS commentator_login
        FROM comments JOIN users
          ON comments.user_id = users.id
        WHERE comments.id = $1
      `,
      [parseInt(id)],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { content, created_at, commentator_id, commentator_login } = result.rows[0];

    const likesInfo = await this.commentLikesQueryRepository.getLikesInfo(id, userId);

    return {
      id,
      content,
      commentatorInfo: {
        userId: commentator_id.toString(),
        userLogin: commentator_login,
      },
      createdAt: created_at,
      likesInfo,
    };
  }

  // async getComments(
  //   postId: string,
  //   userId: string,
  //   pagingParams: PagingParamsType,
  // ): Promise<CommentsPaginatedType> {
  //   const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

  //   const totalCount = await this.model.countDocuments({ postId });
  //   const pagesCount = Math.ceil(totalCount / pageSize);

  //   const commentsWithObjectId = await this.model
  //     .find({ postId }, { postId: 0 })
  //     .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
  //     .skip((pageNumber - 1) * pageSize)
  //     .limit(pageSize)
  //     .lean();

  //   // const commentIds = commentsWithObjectId.map((comment) => comment._id.toString());

  //   const comments = await Promise.all(
  //     commentsWithObjectId.map(async (comment) => {
  //       return {
  //         id: comment._id.toString(),
  //         content: comment.content,
  //         commentatorInfo: comment.commentatorInfo,
  //         createdAt: comment.createdAt,
  //         likesInfo: await this.commentLikesQueryRepository.getLikesInfo(comment._id.toString(), userId),
  //       };
  //     }),
  //   );

  //   return {
  //     pagesCount,
  //     page: pageNumber,
  //     pageSize,
  //     totalCount,
  //     items: comments,
  //   };
  // }

  async getComments(
    postId: string,
    userId: string,
    pagingParams: PagingParamsType,
  ): Promise<CommentsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    let orderBy: string;
    switch (sortBy) {
      case 'commentatorInfo':
        orderBy = 'commentator_id';
        break;
      case 'createdAt':
        orderBy = 'created_at';
        break;
      default:
        orderBy = sortBy;
    }

    const countResult = await this.pool.query(
      `
        SELECT id
        FROM comments
        WHERE post_id = $1
      `,
      [parseInt(postId)],
    );

    const totalCount = countResult.rowCount!;
    const pagesCount = Math.ceil(totalCount / pageSize);
    const skipCount = (pageNumber - 1) * pageSize;

    const commentsResult = await this.pool.query(
      `
        SELECT
          comments.id
          comments.content,
          comments.created_at,
          comments.user_id AS commentator_id,
          users.login AS commentator_login
        FROM comments JOIN users
          ON comments.user_id = users.id
        WHERE comments.post_id = $1
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $2
        OFFSET $3
      `,
      [parseInt(postId), pageSize, skipCount],
    );

    const rawComments = commentsResult.rows;

    const comments = await Promise.all(
      rawComments.map(async (comment) => {
        return {
          id: comment.id.toString(),
          content: comment.content,
          commentatorInfo: {
            userId: comment.commentator_id.toString(),
            userLogin: comment.commentator_login,
          },
          createdAt: comment.created_at,
          likesInfo: await this.commentLikesQueryRepository.getLikesInfo(comment.id.toString(), userId),
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
