import { Inject, Injectable } from '@nestjs/common';
import { BlogsPaginatedType, GetBlogsRepoQueryParams } from '../../types/blogs.types.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';
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

    // qb.select(
    //   `
    //     blog.id::varchar,
    //     blog."name",
    //     blog."description",
    //     blog."websiteUrl",
    //     blog."createdAt",
    //     blog."isMembership"
    //   `,
    // );

    qb.select([
      'blog.id::varchar',
      'blog."name"',
      'blog."description"',
      'blog."websiteUrl"',
      'blog."createdAt"',
      'blog."isMembership"',
    ]);

    if (searchNameTerm) {
      qb.where('blog.name ILIKE :search', { search: `%${searchNameTerm}%` });
    }

    const direction = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    qb.orderBy(`blog.${sortBy}`, direction).take(pageSize).skip(skipCount);

    // const [blogEntities, totalCount] = await qb.getManyAndCount();
    // const blogs = blogEntities.map((blog) => blog.toDto());

    const totalCount = await qb.getCount();
    const blogs = await qb.getRawMany();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: blogs,
    };
  }
}
