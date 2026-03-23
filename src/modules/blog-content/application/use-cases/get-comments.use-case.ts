import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { CommentsPaginatedType, GetCommentsRepoQueryParams } from '../../types/comments.types.js';
import { PostsRepository } from '../../infrastructure/sql/posts.repository.js';
import { CommentsQueryRepository } from '../../infrastructure/sql/comments.query-repository.js';

export class GetCommentsQuery extends Query<CommentsPaginatedType> {
  constructor(public readonly params: GetCommentsRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetCommentsQuery)
export class GetCommentsUseCase implements IQueryHandler<GetCommentsQuery> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(query: GetCommentsQuery) {
    const { params } = query;
    await this.postsRepository.checkPostExists(params.postId);
    return await this.commentsQueryRepository.getComments(params);
  }
}
