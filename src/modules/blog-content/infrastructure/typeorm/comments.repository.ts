import { Injectable } from '@nestjs/common';
import { CreateCommentRepoParams, UpdateCommentRepoParams } from '../../types/comments.types.js';
import { Comment } from './entities/comment.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CommentNotFoundDomainException,
  PostNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class CommentsRepository {
  constructor(@InjectRepository(Comment) private readonly commentEntityRepository: Repository<Comment>) {}

  async checkCommentExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const exists = await this.commentEntityRepository.existsBy({ id: +id });

    if (!exists) {
      throw new CommentNotFoundDomainException();
    }
  }

  async getComment(id: string): Promise<Comment> {
    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const comment = await this.commentEntityRepository.findOneBy({ id: +id });

    if (!comment) {
      throw new CommentNotFoundDomainException();
    }

    return comment;
  }

  async createComment(params: CreateCommentRepoParams): Promise<Comment> {
    const { postId, content, createdAt, commentatorInfo } = params;

    if (!isPositiveIntegerString(postId)) {
      throw new PostNotFoundDomainException();
    }

    if (!isPositiveIntegerString(commentatorInfo.userId)) {
      throw new UnauthorizedDomainException();
    }

    const comment = this.commentEntityRepository.create({
      postId: +postId,
      userId: +commentatorInfo.userId,
      content,
      createdAt,
    });

    return this.commentEntityRepository.save(comment);
  }

  async updateComment(params: UpdateCommentRepoParams): Promise<void> {
    const { id, content } = params;

    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const result = await this.commentEntityRepository.update({ id: +id }, { content });

    if (result.affected === 0) {
      throw new CommentNotFoundDomainException();
    }
  }

  async deleteComment(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const result = await this.commentEntityRepository.softDelete({ id: +id });

    if (result.affected === 0) {
      throw new CommentNotFoundDomainException();
    }
  }
}
