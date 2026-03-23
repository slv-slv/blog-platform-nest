import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { BlogType } from '../../types/blogs.types.js';
import { BlogsRepository } from '../../infrastructure/sql/blogs.repository.js';

export class GetBlogQuery extends Query<BlogType> {
  constructor(public readonly id: string) {
    super();
  }
}

@QueryHandler(GetBlogQuery)
export class GetBlogUseCase implements IQueryHandler<GetBlogQuery> {
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async execute(query: GetBlogQuery) {
    const id = query.id;
    return await this.blogsRepository.getBlog(id);
  }
}
