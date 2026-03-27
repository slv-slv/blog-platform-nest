import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { FindPostRepoQueryParams, PostViewModel } from '../../types/posts.types.js';
import { PostsQueryRepository } from '../../infrastructure/sql/posts.query-repository.js';

export class GetPostQuery extends Query<PostViewModel> {
  constructor(public readonly params: FindPostRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetPostQuery)
export class GetPostUseCase implements IQueryHandler<GetPostQuery> {
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}
  async execute(query: GetPostQuery) {
    const { params } = query;
    return await this.postsQueryRepository.getPost(params);
  }
}
