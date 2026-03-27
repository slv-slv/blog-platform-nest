import { Inject, Injectable } from '@nestjs/common';
import {
  CommentModel,
  CreateCommentRepoParams,
  UpdateCommentRepoParams,
} from '../../types/comments.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import {
  CommentNotFoundDomainException,
  PostNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class CommentsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async checkCommentExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const idNum = +id;

    const result = await this.pool.query(
      `
        SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1) AS exists
      `,
      [idNum],
    );

    if (result.rows[0].exists === false) {
      throw new CommentNotFoundDomainException();
    }
  }

  async getComment(id: string): Promise<CommentModel> {
    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const idNum = +id;

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
      [idNum],
    );

    if (result.rowCount === 0) {
      throw new CommentNotFoundDomainException();
    }

    const { content, created_at, commentator_id, commentator_login } = result.rows[0];

    return {
      id,
      content,
      commentatorInfo: {
        userId: commentator_id.toString(),
        userLogin: commentator_login,
      },
      createdAt: created_at.toISOString(),
    };
  }

  async createComment(params: CreateCommentRepoParams): Promise<CommentModel> {
    const { postId, content, createdAt, commentatorInfo } = params;

    if (!isPositiveIntegerString(postId)) {
      throw new PostNotFoundDomainException();
    }

    if (!isPositiveIntegerString(commentatorInfo.userId)) {
      throw new UnauthorizedDomainException();
    }

    const postIdNum = +postId;
    const userIdNum = +commentatorInfo.userId;

    const result = await this.pool.query(
      `
        INSERT INTO comments (post_id, user_id, content, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [postIdNum, userIdNum, content, createdAt],
    );

    const id = result.rows[0].id.toString();

    return { id, content, commentatorInfo, createdAt: createdAt.toISOString() };
  }
  async updateComment(params: UpdateCommentRepoParams): Promise<boolean> {
    const { id, content } = params;

    if (!isPositiveIntegerString(id)) {
      return false;
    }

    const idNum = +id;

    const result = await this.pool.query(
      `
        UPDATE comments
        SET content = $2
        WHERE id = $1
      `,
      [idNum, content],
    );

    return result.rowCount! > 0;
  }
  async deleteComment(id: string): Promise<boolean> {
    if (!isPositiveIntegerString(id)) {
      return false;
    }

    const idNum = +id;

    const result = await this.pool.query(
      `
        DELETE FROM comments
        WHERE id = $1
      `,
      [idNum],
    );

    return result.rowCount! > 0;
  }
}
