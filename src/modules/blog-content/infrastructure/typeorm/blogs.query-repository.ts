import { Inject, Injectable } from '@nestjs/common';
import { BlogViewType, BlogsPaginatedType, GetBlogsRepoQueryParams } from '../../types/blogs.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './blogs.entities.js';
import { Repository } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>) {}

  async getAllBlogs(params: GetBlogsRepoQueryParams): Promise<BlogsPaginatedType> {
    const { searchNameTerm, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const qb = this.blogEntityRepository.createQueryBuilder('blog');

    if (searchNameTerm) {
      qb.where('blog.name ILIKE :search', { search: `%${searchNameTerm}%` });
    }

    const direction = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    qb.orderBy(`blog.${sortBy}`, direction).take(pageSize).skip(skipCount);

    const [blogs, totalCount] = await qb.getManyAndCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: blogs.map((blog) => this.mapToBlogViewType(blog)),
    };
  }

  private mapToBlogViewType(blog: Blog): BlogViewType {
    return {
      id: blog.id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
  }
}
