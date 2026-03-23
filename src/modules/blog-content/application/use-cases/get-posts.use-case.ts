import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GetPostsRepoQueryParams, PostsPaginatedType } from '../../types/posts.types.js';
import { PostsQueryRepository } from '../../infrastructure/sql/posts.query-repository.js';
import { BlogsRepository } from '../../infrastructure/sql/blogs.repository.js';

export class GetPostsQuery extends Query<PostsPaginatedType> {
  constructor(public readonly params: GetPostsRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetPostsQuery)
export class GetPostsUseCase implements IQueryHandler<GetPostsQuery> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}
  async execute(query: GetPostsQuery) {
    const { params } = query;

    if (params.blogId) {
      await this.blogsRepository.checkBlogExists(params.blogId);
    }

    return await this.postsQueryRepository.getPosts(query.params);
  }
}
