import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { BlogsPaginatedType, GetBlogsRepoQueryParams } from '../../types/blogs.types.js';
import { BlogsQueryRepository } from '../../infrastructure/sql/blogs.query-repository.js';

export class GetBlogsQuery extends Query<BlogsPaginatedType> {
  constructor(public readonly params: GetBlogsRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetBlogsQuery)
export class GetBlogsUseCase implements IQueryHandler<GetBlogsQuery> {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}
  async execute(query: GetBlogsQuery) {
    const { params } = query;
    return await this.blogsQueryRepository.getBlogs(params);
  }
}
