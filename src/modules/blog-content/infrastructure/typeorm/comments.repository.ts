import { Inject, Injectable } from '@nestjs/common';
import { CommentDtoType } from '../../types/comments.types.js';
import { Comment } from './comments.entities.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsRepository {
  constructor(@InjectRepository(Comment) private readonly commentEntityRepository: Repository<Comment>) {}

  async findComment(id: string): Promise<CommentDtoType | null> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const comment = await this.commentEntityRepository.findOne({
      where: { id: idNum },
      relations: { user: true },
    });
    if (!comment) return null;

    return comment.toDto();
  }

  async createComment(
    postId: string,
    content: string,
    createdAt: string,
    commentatorInfo: { userId: string; userLogin: string },
  ): Promise<CommentDtoType> {
    const postIdNum = parseInt(postId);
    const userIdNum = parseInt(commentatorInfo.userId);

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
      createdAt,
    };
  }

  async updateComment(id: string, content: string): Promise<boolean> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return false;

    const result = await this.commentEntityRepository.update({ id: idNum }, { content });
    return result.affected! > 0;
  }

  async deleteComment(id: string): Promise<boolean> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return false;

    const result = await this.commentEntityRepository.softDelete({ id: idNum });
    return result.affected! > 0;
  }
}
