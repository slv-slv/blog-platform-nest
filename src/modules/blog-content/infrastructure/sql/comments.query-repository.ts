import { Inject, Injectable } from '@nestjs/common';
import {
  CommentsPaginatedType,
  CommentViewType,
  FindCommentRepoQueryParams,
  GetCommentsRepoQueryParams,
} from '../../types/comments.types.js';
import { Pool } from 'pg';
import { CommentLikesQueryRepository } from './comment-likes.query-repository.js';
import { PG_POOL } from '../../../../common/constants.js';
import { CommentNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  async findComment(params: FindCommentRepoQueryParams): Promise<CommentViewType> {
    const { commentId: id, userId } = params;
    const result = await this.pool.query(
      `
        SELECT
          comments.id,
          comments.content,
          comments.created_at,
          comments.user_id AS commentator_id,
          users.login AS commentator_login
        FROM comments JOIN users
          ON comments.user_id = users.id
        WHERE comments.id = $1::int
      `,
      [id],
    );

    if (!result.rowCount) {
      throw new CommentNotFoundDomainException();
    }

    const { id: commentId, content, created_at, commentator_id, commentator_login } = result.rows[0];
    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({
      commentIds: [commentId],
      userId,
    });

    return {
      id,
      content,
      commentatorInfo: {
        userId: commentator_id.toString(),
        userLogin: commentator_login,
      },
      createdAt: created_at.toISOString(),
      likesInfo: likesInfoMap.get(commentId)!,
    };
  }
  async getComments(params: GetCommentsRepoQueryParams): Promise<CommentsPaginatedType> {
    const { postId, userId, pagingParams } = params;
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
        SELECT COUNT(id)::int
        FROM comments
        WHERE post_id = $1::int
      `,
      [postId],
    );

    const totalCount = countResult.rows[0].count;
    const pagesCount = Math.ceil(totalCount / pageSize);
    const skipCount = (pageNumber - 1) * pageSize;

    const commentsResult = await this.pool.query(
      `
        SELECT
          comments.id,
          comments.content,
          comments.created_at,
          comments.user_id AS commentator_id,
          users.login AS commentator_login
        FROM comments JOIN users
          ON comments.user_id = users.id
        WHERE comments.post_id = $1::int
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $2
        OFFSET $3
      `,
      [postId, pageSize, skipCount],
    );

    const rawComments = commentsResult.rows;
    const commentIdArr = rawComments.map((comment) => comment.id);
    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({
      commentIds: commentIdArr,
      userId,
    });

    const comments = rawComments.map((comment) => ({
      id: comment.id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentator_id.toString(),
        userLogin: comment.commentator_login,
      },
      createdAt: comment.created_at.toISOString(),
      likesInfo: likesInfoMap.get(comment.id)!,
    }));

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: comments,
    };
  }
}
