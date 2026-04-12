import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { CommentViewModel, FindCommentRepoQueryParams } from '../../types/comments.types.js';
import { CommentsQueryRepository } from '../../infrastructure/typeorm/comments.query-repository.js';

export class GetCommentQuery extends Query<CommentViewModel> {
  constructor(public readonly params: FindCommentRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetCommentQuery)
export class GetCommentUseCase implements IQueryHandler<GetCommentQuery> {
  constructor(private readonly commentsQueryRepository: CommentsQueryRepository) {}
  async execute(query: GetCommentQuery) {
    return this.commentsQueryRepository.getComment(query.params);
  }
}
