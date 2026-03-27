import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { BlogViewModel } from '../../types/blogs.types.js';
import { BlogsQueryRepository } from '../../infrastructure/sql/blogs.query-repository.js';

export class GetBlogQuery extends Query<BlogViewModel> {
  constructor(public readonly id: string) {
    super();
  }
}

@QueryHandler(GetBlogQuery)
export class GetBlogUseCase implements IQueryHandler<GetBlogQuery> {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}
  async execute(query: GetBlogQuery) {
    const id = query.id;
    return await this.blogsQueryRepository.getBlog(id);
  }
}
