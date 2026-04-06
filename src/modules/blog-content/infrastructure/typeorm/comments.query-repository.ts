import { Injectable } from '@nestjs/common';
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
import { CommentNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';

type RawCommentRow = {
  id: number;
  content: string;
  createdAt: Date | string;
  userId: number;
  userLogin: string;
};

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(Comment) private readonly commentEntityRepository: Repository<Comment>,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  async getComment(params: FindCommentRepoQueryParams): Promise<CommentViewModel> {
    const { commentId: id, userId } = params;

    if (!isPositiveIntegerString(id)) {
      throw new CommentNotFoundDomainException();
    }

    const comment = await this.commentEntityRepository
      .createQueryBuilder('comment')
      .select('comment.id', 'id')
      .addSelect('comment.content', 'content')
      .addSelect('comment.createdAt', 'createdAt')
      .addSelect('comment.userId', 'userId')
      .addSelect('user.login', 'userLogin')
      .innerJoin('users', 'user', 'user.id = comment.userId')
      .where('comment.id = :id', { id: +id })
      .getRawOne<RawCommentRow>();

    if (!comment) {
      throw new CommentNotFoundDomainException();
    }

    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({
      commentIds: [comment.id],
      userId,
    });

    return {
      ...this.mapToCommentViewModel(comment),
      likesInfo: likesInfoMap.get(comment.id)!,
    };
  }

  async getComments(params: GetCommentsRepoQueryParams): Promise<CommentsPaginatedViewModel> {
    const { postId, userId, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    if (!isPositiveIntegerString(postId)) {
      return {
        pagesCount: 0,
        page: pageNumber,
        pageSize,
        totalCount: 0,
        items: [],
      };
    }

    const direction = sortDirection === SortDirection.asc ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    let orderBy: string;
    switch (sortBy) {
      case 'commentatorInfo':
        orderBy = 'comment.userId';
        break;
      case 'createdAt':
        orderBy = 'comment.createdAt';
        break;
      default:
        orderBy = `comment.${sortBy}`;
    }

    const qb = this.commentEntityRepository
      .createQueryBuilder('comment')
      .select('comment.id', 'id')
      .addSelect('comment.content', 'content')
      .addSelect('comment.createdAt', 'createdAt')
      .addSelect('comment.userId', 'userId')
      .addSelect('user.login', 'userLogin')
      .innerJoin('users', 'user', 'user.id = comment.userId')
      .where('comment.postId = :postId', { postId: +postId });

    const totalCount = await qb.clone().getCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    const comments = await qb
      .clone()
      .orderBy(orderBy, direction)
      .take(pageSize)
      .skip(skipCount)
      .getRawMany<RawCommentRow>();
    const commentIds = comments.map((comment) => comment.id);
    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({ commentIds, userId });
    const items = comments.map((comment) => ({
      ...this.mapToCommentViewModel(comment),
      likesInfo: likesInfoMap.get(comment.id)!,
    }));

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  private mapToCommentViewModel(comment: RawCommentRow): Omit<CommentViewModel, 'likesInfo'> {
    return {
      id: comment.id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId.toString(),
        userLogin: comment.userLogin,
      },
      createdAt: new Date(comment.createdAt).toISOString(),
    };
  }
}
