import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { BlogsPaginatedViewModel, GetBlogsRepoQueryParams } from '../../types/blogs.types.js';
import { BlogsQueryRepository } from '../../infrastructure/typeorm/blogs.query-repository.js';

export class GetBlogsQuery extends Query<BlogsPaginatedViewModel> {
  constructor(public readonly params: GetBlogsRepoQueryParams) {
    super();
  }
}

@QueryHandler(GetBlogsQuery)
export class GetBlogsUseCase implements IQueryHandler<GetBlogsQuery> {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}
  async execute(query: GetBlogsQuery) {
    const { params } = query;
    return this.blogsQueryRepository.getBlogs(params);
  }
}
