import { Inject, Injectable } from '@nestjs/common';
import {
  CommentModel,
  CreateCommentRepoParams,
  UpdateCommentRepoParams,
} from '../../types/comments.types.js';
import { Comment } from './comments.entities.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsRepository {
  constructor(@InjectRepository(Comment) private readonly commentEntityRepository: Repository<Comment>) {}

  async getComment(id: string): Promise<CommentModel | null> {
    const idNum = +id;
    if (isNaN(idNum)) return null;

    const comment = await this.commentEntityRepository.findOne({
      where: { id: idNum },
      relations: { user: true },
    });
    if (!comment) return null;

    return comment.toModel();
  }

  async createComment(params: CreateCommentRepoParams): Promise<CommentModel> {
    const { postId, content, createdAt, commentatorInfo } = params;
    const postIdNum = +postId;
    const userIdNum = +commentatorInfo.userId;

    const comment = this.commentEntityRepository.create({
      post: { id: postIdNum },
      user: { id: userIdNum },
      content,
      createdAt,
    });

    const savedComment = await this.commentEntityRepository.save(comment);
    const id = savedComment.id.toString();

    return {
      id,
      content,
      commentatorInfo,
      createdAt: createdAt.toISOString(),
    };
  }

  async updateComment(params: UpdateCommentRepoParams): Promise<boolean> {
    const { id, content } = params;
    const idNum = +id;
    if (isNaN(idNum)) return false;

    const result = await this.commentEntityRepository.update({ id: idNum }, { content });
    return result.affected! > 0;
  }

  async deleteComment(id: string): Promise<boolean> {
    const idNum = +id;
    if (isNaN(idNum)) return false;

    const result = await this.commentEntityRepository.softDelete({ id: idNum });
    return result.affected! > 0;
  }
}
