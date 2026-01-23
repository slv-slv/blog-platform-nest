import { Inject, Injectable } from '@nestjs/common';
import { BlogsPaginatedType } from '../../types/blogs.types.js';
import { PagingParamsType, SortDirection } from '../../../common/types/paging-params.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './blogs.entities.js';
import { Repository } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>) {}

  async getAllBlogs(
    searchNameTerm: string | null,
    pagingParams: PagingParamsType,
  ): Promise<BlogsPaginatedType> {
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
