import { Inject, Injectable } from '@nestjs/common';
import { CreatePostRepoParams, PostModel, UpdatePostRepoParams } from '../../types/posts.types.js';
import { Pool } from 'pg';
import { PG_POOL } from '../../../../common/constants.js';
import {
  BlogNotFoundDomainException,
  PostNotFoundDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class PostsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async checkPostExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.pool.query(
      `
        SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1::int) AS exists
      `,
      [id],
    );

    if (result.rows[0].exists === false) {
      throw new PostNotFoundDomainException();
    }
  }

  async getPost(id: string): Promise<PostModel> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.pool.query(
      `
        SELECT
          posts.title,
          posts.short_description,
          posts.content,
          posts.blog_id,
          blogs.name AS blog_name,
          posts.created_at
        FROM posts JOIN blogs
          ON posts.blog_id = blogs.id
        WHERE posts.id = $1::int
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new PostNotFoundDomainException();
    }

    const rawPost = result.rows[0];

    return {
      id,
      title: rawPost.title,
      shortDescription: rawPost.short_description,
      content: rawPost.content,
      blogId: rawPost.blog_id.toString(),
      blogName: rawPost.blog_name,
      createdAt: rawPost.created_at.toISOString(),
    };
  }

  async createPost(params: CreatePostRepoParams): Promise<PostModel> {
    const { title, shortDescription, content, blogId, blogName, createdAt } = params;

    if (!isPositiveIntegerString(blogId)) {
      throw new BlogNotFoundDomainException();
    }

    const result = await this.pool.query(
      `
        INSERT INTO posts (blog_id, title, short_description, content, created_at)
        VALUES ($1::int, $2, $3, $4, $5)
        RETURNING id
      `,
      [blogId, title, shortDescription, content, createdAt],
    );

    const id = result.rows[0].id.toString();

    return {
      id,
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      createdAt: createdAt.toISOString(),
    };
  }
  async updatePost(params: UpdatePostRepoParams): Promise<void> {
    const { id, title, shortDescription, content } = params;

    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.pool.query(
      `
        UPDATE posts
        SET title = $2, short_description = $3, content = $4
        WHERE id = $1::int
      `,
      [id, title, shortDescription, content],
    );

    if (result.rowCount === 0) {
      throw new PostNotFoundDomainException();
    }
  }

  async deletePost(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.pool.query(
      `
        DELETE FROM posts
        WHERE id = $1::int
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new PostNotFoundDomainException();
    }
  }
}
