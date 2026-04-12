import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GetPostsRepoQueryParams, PostsPaginatedViewModel } from '../../types/posts.types.js';
import { PostsQueryRepository } from '../../infrastructure/typeorm/posts.query-repository.js';
import { BlogsQueryRepository } from '../../infrastructure/typeorm/blogs.query-repository.js';

export class GetPostsQuery extends Query<PostsPaginatedViewModel> {
  constructor(public readonly params: GetPostsRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetPostsQuery)
export class GetPostsUseCase implements IQueryHandler<GetPostsQuery> {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}
  async execute(query: GetPostsQuery) {
    const { params } = query;

    if (params.blogId) {
      await this.blogsQueryRepository.checkBlogExists(params.blogId);
    }

    return this.postsQueryRepository.getPosts(query.params);
  }
}
