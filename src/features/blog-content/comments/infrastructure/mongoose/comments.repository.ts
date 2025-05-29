import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './comments.schemas.js';
import { Model } from 'mongoose';
import { CommentDtoType } from '../../comments.types.js';
import { ObjectId } from 'mongodb';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private readonly model: Model<Comment>,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  // async findComment(id: string): Promise<CommentDtoType | null> {
  //   if (!ObjectId.isValid(id)) {
  //     return null;
  //   }
  //   const _id = new ObjectId(id);
  //   const comment = await this.model.findById(_id, { _id: 0 }).lean();
  //   if (!comment) {
  //     return null;
  //   }
  //   return { id, ...comment };
  // }

  async findComment(id: string): Promise<CommentDtoType | null> {
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

    return {
      id,
      content,
      commentatorInfo: {
        userId: commentator_id.toString(),
        userLogin: commentator_login,
      },
      createdAt: created_at,
    };
  }

  // async createComment(
  //   postId: string,
  //   content: string,
  //   createdAt: string,
  //   commentatorInfo: { userId: string; userLogin: string },
  // ): Promise<CommentDtoType> {
  //   const _id = new ObjectId();
  //   await this.model.insertOne({
  //     _id,
  //     postId,
  //     content,
  //     commentatorInfo,
  //     createdAt,
  //   });
  //   const id = _id.toString();
  //   return { id, content, commentatorInfo, createdAt };
  // }

  async createComment(
    postId: string,
    content: string,
    createdAt: string,
    commentatorInfo: { userId: string; userLogin: string },
  ): Promise<CommentDtoType> {
    const result = await this.pool.query(
      `
        INSERT INTO comments (post_id, user_id, content, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [parseInt(postId), commentatorInfo.userId, content, createdAt],
    );

    const id = result.rows[0].id.toString();

    return { id, content, commentatorInfo, createdAt };
  }

  // async updateComment(id: string, content: string): Promise<boolean> {
  //   if (!ObjectId.isValid(id)) {
  //     return false;
  //   }
  //   const _id = new ObjectId(id);
  //   const updateResult = await this.model.updateOne({ _id }, { $set: { content } });
  //   return updateResult.matchedCount > 0;
  // }

  async updateComment(id: string, content: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        UPDATE comments
        SET content = $2
        WHERE id = $1
      `,
      [parseInt(id), content],
    );

    return result.rowCount! > 0;
  }

  // async deleteComment(id: string): Promise<boolean> {
  //   if (!ObjectId.isValid(id)) {
  //     return false;
  //   }
  //   const _id = new ObjectId(id);
  //   const deleteResult = await this.model.deleteOne({ _id });
  //   return deleteResult.deletedCount > 0;
  // }

  async deleteComment(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        DELETE FROM comments
        WHERE id = $1
      `,
      [parseInt(id)],
    );

    return result.rowCount! > 0;
  }
}
