import { Inject, Injectable } from '@nestjs/common';
import { PostDtoType } from '../../types/posts.types.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../typeorm/posts.entities.js';
import { Repository } from 'typeorm';
import { Blog } from '../../../01-blogs/repositories/typeorm/blogs.entities.js';

@Injectable()
export class PostsRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    @InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>,
    @InjectRepository(Post) private readonly postEntityRepository: Repository<Post>,
  ) {}

  // async findPost(id: string): Promise<PostDtoType | null> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT
  //         posts.title,
  //         posts.short_description,
  //         posts.content,
  //         posts.blog_id,
  //         blogs.name AS blog_name,
  //         posts.created_at
  //       FROM posts JOIN blogs
  //         ON posts.blog_id = blogs.id
  //       WHERE posts.id = $1
  //     `,
  //     [parseInt(id)],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const rawPost = result.rows[0];

  //   return {
  //     id,
  //     title: rawPost.title,
  //     shortDescription: rawPost.short_description,
  //     content: rawPost.content,
  //     blogId: rawPost.blog_id.toString(),
  //     blogName: rawPost.blog_name,
  //     createdAt: rawPost.created_at,
  //   };
  // }

  async findPost(id: string): Promise<PostDtoType | null> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const post = await this.postEntityRepository
      .createQueryBuilder('post')
      .where('post.id = :id', { id: idNum })
      .getOne();

    if (!post) return null;
    return post.toDto();
  }

  // async createPost(
  //   title: string,
  //   shortDescription: string,
  //   content: string,
  //   blogId: string,
  //   createdAt: string,
  // ): Promise<PostDtoType | null> {
  //   const blogIdInt = parseInt(blogId);

  //   const blogNameResult = await this.pool.query(
  //     `
  //       SELECT name FROM blogs
  //       WHERE id = $1
  //     `,
  //     [blogIdInt],
  //   );

  //   if (blogNameResult.rowCount === 0) {
  //     return null;
  //   }

  //   const { name: blogName } = blogNameResult.rows[0];

  //   const result = await this.pool.query(
  //     `
  //       INSERT INTO posts (blog_id, title, short_description, content, created_at)
  //       VALUES ($1, $2, $3, $4, $5)
  //       RETURNING id
  //     `,
  //     [blogIdInt, title, shortDescription, content, createdAt],
  //   );

  //   const id = result.rows[0].id.toString();

  //   return {
  //     id,
  //     title,
  //     shortDescription,
  //     content,
  //     blogId,
  //     blogName,
  //     createdAt,
  //   };
  // }

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    createdAt: string,
  ): Promise<PostDtoType | null> {
    const blogIdNum = parseInt(blogId);
    if (isNaN(blogIdNum)) return null;

    const blog = await this.blogEntityRepository.findOne({
      select: {
        name: true,
      },
      where: { id: blogIdNum },
    });

    if (!blog) return null;

    const { name: blogName } = blog;

    // const result = await this.postEntityRepository
    //   .createQueryBuilder('post')
    //   .insert()
    //   .into(Post)
    //   .values({ title, shortDescription, content, blog: { id: blogIdNum }, createdAt })
    //   .execute();

    // const id = result.identifiers[0].toString();

    const savedPost = await this.postEntityRepository.save({
      title,
      shortDescription,
      content,
      blog: { id: blogIdNum },
      createdAt,
    });

    const id = savedPost.id.toString();

    return { id, title, shortDescription, content, blogId, blogName, createdAt };
  }

  async updatePost(id: string, title: string, shortDescription: string, content: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        UPDATE posts
        SET title = $2, short_description = $3, content = $4
        WHERE id = $1
      `,
      [parseInt(id), title, shortDescription, content],
    );

    return result.rowCount! > 0;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        DELETE FROM posts
        WHERE id = $1
      `,
      [parseInt(id)],
    );

    return result.rowCount! > 0;
  }
}
