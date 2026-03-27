import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { CommentViewModel, FindCommentRepoQueryParams } from '../../types/comments.types.js';
import { CommentsQueryRepository } from '../../infrastructure/sql/comments.query-repository.js';

export class GetCommentQuery extends Query<CommentViewModel> {
  constructor(public readonly params: FindCommentRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetCommentQuery)
export class GetCommentUseCase implements IQueryHandler<GetCommentQuery> {
  constructor(private readonly commentsQueryRepository: CommentsQueryRepository) {}
  async execute(query: GetCommentQuery) {
    return await this.commentsQueryRepository.getComment(query.params);
  }
}
