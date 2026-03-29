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
import { SortDirection } from '../../../../common/types/paging-params.types.js';

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

    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({
      commentIds: [comment.id],
      userId,
    });

    return {
      ...comment.toModel(),
      likesInfo: likesInfoMap.get(comment.id)!,
    };
  }

  async getComments(params: GetCommentsRepoQueryParams): Promise<CommentsPaginatedViewModel> {
    const { postId, userId, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const direction = sortDirection === SortDirection.asc ? 'ASC' : 'DESC';
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
    const commentIds = commentsEntities.map((comment) => comment.id);
    const likesInfoMap = await this.commentLikesQueryRepository.getLikesInfo({ commentIds, userId });
    const comments = commentsEntities.map((comment) => ({
      ...comment.toModel(),
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
