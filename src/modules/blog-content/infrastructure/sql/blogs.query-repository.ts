import { Inject, Injectable } from '@nestjs/common';
import { BlogViewModel, BlogsPaginatedViewModel, GetBlogsRepoQueryParams } from '../../types/blogs.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import { BlogNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class BlogsQueryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getBlog(id: string): Promise<BlogViewModel> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const idNum = +id;

    const result = await this.pool.query(
      `
        SELECT *
        FROM blogs
        WHERE id = $1
      `,
      [idNum],
    );

    if (result.rowCount === 0) {
      throw new BlogNotFoundDomainException();
    }

    const blog = result.rows[0];

    return {
      id: blog.id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.website_url,
      createdAt: blog.created_at.toISOString(),
      isMembership: blog.is_membership,
    };
  }

  async checkBlogExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const idNum = +id;

    const result = await this.pool.query(
      `
        SELECT EXISTS(SELECT 1 FROM blogs WHERE id = $1) AS exists
      `,
      [idNum],
    );

    if (result.rows[0].exists === false) {
      throw new BlogNotFoundDomainException();
    }
  }

  async getBlogs(params: GetBlogsRepoQueryParams): Promise<BlogsPaginatedViewModel> {
    const { searchNameTerm, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;
    const conditions: string[] = [];
    const values: unknown[] = [];

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

    if (searchNameTerm) {
      values.push(`%${searchNameTerm}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.pool.query(
      `
        SELECT COUNT(id)::int
        FROM blogs
        ${whereClause}
      `,
      values,
    );

    const totalCount = countResult.rows[0].count;
    const pagesCount = Math.ceil(totalCount / pageSize);
    const skipCount = (pageNumber - 1) * pageSize;
    const blogsQueryValues = [...values, pageSize, skipCount];

    const blogsResult = await this.pool.query(
      `
        SELECT *
        FROM blogs
        ${whereClause}
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      blogsQueryValues,
    );

    const rawBlogs = blogsResult.rows;

    const blogs = rawBlogs.map((blog) => ({
      id: blog.id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.website_url,
      createdAt: blog.created_at.toISOString(),
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
