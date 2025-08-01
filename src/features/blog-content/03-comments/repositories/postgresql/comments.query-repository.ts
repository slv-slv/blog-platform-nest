import { Inject, Injectable } from '@nestjs/common';
import { CommentsPaginatedType, CommentViewType } from '../../types/comments.types.js';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import { CommentLikesQueryRepository } from '../../../04-likes/comments/repositories/postgresql/comment-likes.query-repository.js';
import { Comment } from '../typeorm/comments.entities.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    @InjectRepository(Comment) private readonly commentEntityRepository: Repository<Comment>,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  // async findComment(id: string, userId: string | null): Promise<CommentViewType | null> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT
  //         comments.content,
  //         comments.created_at,
  //         comments.user_id AS commentator_id,
  //         users.login AS commentator_login
  //       FROM comments JOIN users
  //         ON comments.user_id = users.id
  //       WHERE comments.id = $1
  //     `,
  //     [parseInt(id)],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const { content, created_at, commentator_id, commentator_login } = result.rows[0];

  //   const likesInfo = await this.commentLikesQueryRepository.getLikesInfo(id, userId);

  //   return {
  //     id,
  //     content,
  //     commentatorInfo: {
  //       userId: commentator_id.toString(),
  //       userLogin: commentator_login,
  //     },
  //     createdAt: created_at,
  //     likesInfo,
  //   };
  // }

  async findComment(id: string, userId: string | null): Promise<CommentViewType | null> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const comment = await this.commentEntityRepository.findOne({
      where: { id: idNum },
      relations: { user: true },
    });
    if (!comment) return null;

    return comment.toViewType(userId);
  }

  // async getComments(
  //   postId: string,
  //   userId: string | null,
  //   pagingParams: PagingParamsType,
  // ): Promise<CommentsPaginatedType> {
  //   const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

  //   let orderBy: string;
  //   switch (sortBy) {
  //     case 'commentatorInfo':
  //       orderBy = 'commentator_id';
  //       break;
  //     case 'createdAt':
  //       orderBy = 'created_at';
  //       break;
  //     default:
  //       orderBy = sortBy;
  //   }

  //   const countResult = await this.pool.query(
  //     `
  //       SELECT COUNT(id)
  //       FROM comments
  //       WHERE post_id = $1
  //     `,
  //     [parseInt(postId)],
  //   );

  //   const totalCount = parseInt(countResult.rows[0].count);
  //   const pagesCount = Math.ceil(totalCount / pageSize);
  //   const skipCount = (pageNumber - 1) * pageSize;

  //   const commentsResult = await this.pool.query(
  //     `
  //       SELECT
  //         comments.id,
  //         comments.content,
  //         comments.created_at,
  //         comments.user_id AS commentator_id,
  //         users.login AS commentator_login
  //       FROM comments JOIN users
  //         ON comments.user_id = users.id
  //       WHERE comments.post_id = $1
  //       ORDER BY ${orderBy} ${sortDirection}
  //       LIMIT $2
  //       OFFSET $3
  //     `,
  //     [parseInt(postId), pageSize, skipCount],
  //   );

  //   const rawComments = commentsResult.rows;

  //   const comments = await Promise.all(
  //     rawComments.map(async (comment) => {
  //       return {
  //         id: comment.id.toString(),
  //         content: comment.content,
  //         commentatorInfo: {
  //           userId: comment.commentator_id.toString(),
  //           userLogin: comment.commentator_login,
  //         },
  //         createdAt: comment.created_at,
  //         likesInfo: await this.commentLikesQueryRepository.getLikesInfo(comment.id.toString(), userId),
  //       };
  //     }),
  //   );

  //   return {
  //     pagesCount,
  //     page: pageNumber,
  //     pageSize,
  //     totalCount,
  //     items: comments,
  //   };
  // }

  async getComments(
    postId: string,
    userId: string | null,
    pagingParams: PagingParamsType,
  ): Promise<CommentsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const direction = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    const qb = this.commentEntityRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .innerJoinAndSelect('comment.post', 'post')
      .where('post.id = :postId', { postId })
      .orderBy(sortBy, direction)
      .take(pageSize)
      .skip(skipCount);

    const totalCount = await qb.getCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    const commentsEntities = await qb.getMany();
    const comments = await Promise.all(
      commentsEntities.map(async (commentEntity) => await commentEntity.toViewType(userId)),
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
