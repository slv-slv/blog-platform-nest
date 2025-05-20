import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { BlogsPaginatedType } from '../../blogs.types.js';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from './blogs.schemas.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name) private readonly model: Model<Blog>,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  // async getAllBlogs(
  //   searchNameTerm: string | null,
  //   pagingParams: PagingParamsType,
  // ): Promise<BlogsPaginatedType> {
  //   const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

  //   const filter = searchNameTerm ? { name: { $regex: searchNameTerm, $options: 'i' } } : {};

  //   const totalCount = await this.model.countDocuments(filter);
  //   const pagesCount = Math.ceil(totalCount / pageSize);

  //   const blogsWithObjectId = await this.model
  //     .find(filter)
  //     .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
  //     .skip((pageNumber - 1) * pageSize)
  //     .limit(pageSize)
  //     .lean();

  //   const blogs = blogsWithObjectId.map((blog) => {
  //     return {
  //       id: blog._id.toString(),
  //       name: blog.name,
  //       description: blog.description,
  //       websiteUrl: blog.websiteUrl,
  //       createdAt: blog.createdAt,
  //       isMembership: blog.isMembership,
  //     };
  //   });

  //   return {
  //     pagesCount,
  //     page: pageNumber,
  //     pageSize,
  //     totalCount,
  //     items: blogs,
  //   };
  // }

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

    const totalCount = countResult.rows[0];
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
