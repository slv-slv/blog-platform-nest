import { Inject, Injectable } from '@nestjs/common';
import { BlogType, CreateBlogRepoParams, UpdateBlogRepoParams } from '../../types/blogs.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import { BlogNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class BlogsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findBlog(id: string): Promise<BlogType> {
    const result = await this.pool.query(
      `
        SELECT *
        FROM blogs
        WHERE id = $1::int
      `,
      [id],
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
      createdAt: blog.created_at,
      isMembership: blog.is_membership,
    };
  }

  async createBlog(params: CreateBlogRepoParams): Promise<BlogType> {
    const { name, description, websiteUrl, createdAt, isMembership } = params;
    const newBlog = { name, description, websiteUrl, createdAt, isMembership };

    const result = await this.pool.query(
      `
        INSERT INTO blogs (name, description, website_url, created_at, is_membership)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [name, description, websiteUrl, createdAt, isMembership],
    );

    const id = result.rows[0].id.toString();

    return { id, ...newBlog };
  }
  async updateBlog(params: UpdateBlogRepoParams): Promise<void> {
    const { id, name, description, websiteUrl } = params;
    const result = await this.pool.query(
      `
        UPDATE blogs
        SET name = $2, description = $3, website_url = $4
        WHERE id = $1::int
      `,
      [id, name, description, websiteUrl],
    );

    if (!result.rowCount) {
      throw new BlogNotFoundDomainException();
    }
  }

  async deleteBlog(id: string): Promise<void> {
    const result = await this.pool.query(
      `
        DELETE FROM blogs
        WHERE id = $1::int
      `,
      [id],
    );

    if (!result.rowCount) {
      throw new BlogNotFoundDomainException();
    }
  }
}
