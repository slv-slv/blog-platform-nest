import { Injectable } from '@nestjs/common';
import { BlogViewModel, BlogsPaginatedViewModel, GetBlogsRepoQueryParams } from '../../types/blogs.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity.js';
import { Repository } from 'typeorm';
import { BlogNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>) {}

  async getBlog(id: string): Promise<BlogViewModel> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const blog = await this.blogEntityRepository.findOneBy({ id: +id });

    if (!blog) {
      throw new BlogNotFoundDomainException();
    }

    return this.mapToBlogViewModel(blog);
  }

  async checkBlogExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const exists = await this.blogEntityRepository.existsBy({ id: +id });

    if (!exists) {
      throw new BlogNotFoundDomainException();
    }
  }

  async getBlogs(params: GetBlogsRepoQueryParams): Promise<BlogsPaginatedViewModel> {
    const { searchNameTerm, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const qb = this.blogEntityRepository.createQueryBuilder('blog');

    if (searchNameTerm) {
      qb.where('blog.name ILIKE :search', { search: `%${searchNameTerm}%` });
    }

    const direction = sortDirection === SortDirection.asc ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    qb.orderBy(`blog.${sortBy}`, direction).take(pageSize).skip(skipCount);

    const [blogs, totalCount] = await qb.getManyAndCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: blogs.map((blog) => this.mapToBlogViewModel(blog)),
    };
  }

  private mapToBlogViewModel(blog: Blog): BlogViewModel {
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
