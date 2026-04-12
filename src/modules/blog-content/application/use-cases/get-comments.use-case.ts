import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { CommentsPaginatedViewModel, GetCommentsRepoQueryParams } from '../../types/comments.types.js';
import { CommentsQueryRepository } from '../../infrastructure/typeorm/comments.query-repository.js';
import { PostsQueryRepository } from '../../infrastructure/typeorm/posts.query-repository.js';

export class GetCommentsQuery extends Query<CommentsPaginatedViewModel> {
  constructor(public readonly params: GetCommentsRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetCommentsQuery)
export class GetCommentsUseCase implements IQueryHandler<GetCommentsQuery> {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(query: GetCommentsQuery) {
    const { params } = query;
    await this.postsQueryRepository.checkPostExists(params.postId);
    return this.commentsQueryRepository.getComments(params);
  }
}
