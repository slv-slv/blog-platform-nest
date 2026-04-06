import { Injectable } from '@nestjs/common';
import {
  CommentModel,
  CreateCommentRepoParams,
  UpdateCommentRepoParams,
} from '../../types/comments.types.js';
import { Comment } from './comments.entities.js';
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

  async getComment(id: string): Promise<CommentModel> {
    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const comment = await this.commentEntityRepository.findOne({
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
      },
      where: { id: +id },
    });

    if (!comment) {
      throw new CommentNotFoundDomainException();
    }

    const user = await this.commentEntityRepository.manager
      .createQueryBuilder()
      .select('user.login', 'login')
      .from('users', 'user')
      .where('user.id = :userId', { userId: comment.userId })
      .getRawOne<{ login: string }>();

    if (!user) {
      throw new CommentNotFoundDomainException();
    }

    return this.mapToCommentModel(comment, user.login);
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

    const result = await this.commentEntityRepository.insert({
      postId: postIdNum,
      userId: userIdNum,
      content,
      createdAt,
    });
    const identifier = result.identifiers[0] as { id: number };
    const id = identifier.id.toString();

    return {
      id,
      content,
      commentatorInfo,
      createdAt: createdAt.toISOString(),
    };
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

  private mapToCommentModel(comment: Comment, userLogin: string): CommentModel {
    return {
      id: comment.id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId.toString(),
        userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
