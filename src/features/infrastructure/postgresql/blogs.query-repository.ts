import { Inject, Injectable } from '@nestjs/common';
import { BlogsPaginatedType } from '../../types/blogs.types.js';
import { PagingParamsType, SortDirection } from '../../../common/types/paging-params.types.js';
import { pool } from '../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class BlogsQueryRepository {
  constructor(@Inject(pool) private readonly pool: Pool) {}

  async getAllBlogs(
    searchNameTerm: string | null,
    pagingParams: PagingParamsType,
  ): Promise<BlogsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    let orderBy: string;

    switch (sortBy) {
      case 'websiteUrl':
        orderBy = 'website_url';
        break;
      case 'createdAt':
        orderBy = 'created_at';
        break;
      case 'isMembership':
        orderBy = 'is_membership';
        break;
      default:
        orderBy = sortBy;
    }

    const whereClause = searchNameTerm ? `WHERE name ILIKE '%${searchNameTerm}%'` : ``;

    const countResult = await this.pool.query(
      `
        SELECT COUNT(id)
        FROM blogs
        ${whereClause}
      `,
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const pagesCount = Math.ceil(totalCount / pageSize);
    const skipCount = (pageNumber - 1) * pageSize;

    const blogsResult = await this.pool.query(
      `
        SELECT *
        FROM blogs
        ${whereClause}
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $1
        OFFSET $2
      `,
      [pageSize, skipCount],
    );

    const rawBlogs = blogsResult.rows;

    const blogs = rawBlogs.map((blog) => ({
      id: blog.id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.website_url,
      createdAt: blog.created_at,
      isMembership: blog.is_membership,
    }));

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: blogs,
    };
  }
}
