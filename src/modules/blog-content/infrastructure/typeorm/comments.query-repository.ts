import { Inject, Injectable } from '@nestjs/common';
import {
  CommentsPaginatedViewModel,
  CommentViewModel,
  FindCommentRepoQueryParams,
  GetCommentsRepoQueryParams,
} from '../../types/comments.types.js';
import { CommentLikesQueryRepository } from './comment-likes.query-repository.js';
import { Comment } from './comments.entities.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(Comment) private readonly commentEntityRepository: Repository<Comment>,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  async getComment(params: FindCommentRepoQueryParams): Promise<CommentViewModel | null> {
    const { commentId: id, userId } = params;
    const idNum = +id;
    if (isNaN(idNum)) return null;

    const comment = await this.commentEntityRepository.findOne({
      where: { id: idNum },
      relations: { user: true },
    });
    if (!comment) return null;

    return comment.toViewModel(userId);
  }

  async getComments(params: GetCommentsRepoQueryParams): Promise<CommentsPaginatedViewModel> {
    const { postId, userId, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const direction = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    const qb = this.commentEntityRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .innerJoinAndSelect('comment.post', 'post')
      .where('post.id = :postId', { postId: +postId })
      .orderBy(sortBy, direction)
      .take(pageSize)
      .skip(skipCount);

    const totalCount = await qb.getCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    const commentsEntities = await qb.getMany();
    const comments = await Promise.all(
      commentsEntities.map(async (commentEntity) => await commentEntity.toViewModel(userId)),
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
