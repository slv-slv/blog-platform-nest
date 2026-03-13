import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './comments.schemas.js';
import { Model } from 'mongoose';
import {
  CommentDtoType,
  CreateCommentRepoParams,
  UpdateCommentRepoParams,
} from '../../types/comments.types.js';
import { ObjectId } from 'mongodb';

@Injectable()
export class CommentsRepository {
  constructor(@InjectModel(Comment.name) private readonly model: Model<Comment>) {}

  async findComment(id: string): Promise<CommentDtoType | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const comment = await this.model.findById(_id, { _id: 0 }).lean();
    if (!comment) {
      return null;
    }
    return { id, ...comment };
  }

  async createComment(params: CreateCommentRepoParams): Promise<CommentDtoType> {
    const { postId, content, createdAt, commentatorInfo } = params;
    const createdComment = await this.model.create({
      postId,
      content,
      commentatorInfo,
      createdAt,
    });

    const id = createdComment._id.toString();
    return { id, content, commentatorInfo, createdAt };
  }

  async updateComment(params: UpdateCommentRepoParams): Promise<boolean> {
    const { id, content } = params;
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const updateResult = await this.model.updateOne({ _id }, { $set: { content } }, { runValidators: true });
    return updateResult.matchedCount > 0;
  }

  async deleteComment(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const deleteResult = await this.model.deleteOne({ _id });
    return deleteResult.deletedCount > 0;
  }
}
