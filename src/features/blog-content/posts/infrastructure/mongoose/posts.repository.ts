import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './posts.schemas.js';
import { ObjectId } from 'mongodb';
import { PostDtoType } from '../../posts.types.js';
import { BlogsRepository } from '../../../blogs/infrastructure/mongoose/blogs.repository.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<Post>,
    @Inject(pool) private readonly pool: Pool,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  // async findPost(id: string): Promise<PostDtoType | null> {
  //   if (!ObjectId.isValid(id)) {
  //     return null;
  //   }
  //   const _id = new ObjectId(id);
  //   const post = await this.model.findOne({ _id }, { _id: 0 }).lean();
  //   if (!post) {
  //     return null;
  //   }
  //   return { id, ...post };
  // }

  async findPost(id: string): Promise<PostDtoType | null> {
    const result = await this.pool.query(
      `
        SELECT
          posts.title,
          posts.short_description,
          posts.content,
          posts.blog_id,
          blogs.name AS blog_name,
          posts.created_at,
        FROM posts JOIN blogs
          ON posts.blog_id = blogs.id
        WHERE posts.id = $1
      `,
      [parseInt(id)],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const rawPost = result.rows[0];

    return {
      id,
      title: rawPost.title,
      shortDescription: rawPost.short_description,
      content: rawPost.content,
      blogId: rawPost.blog_id.toString(),
      blogName: rawPost.blog_name,
      createdAt: rawPost.created_at,
    };
  }

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    createdAt: string,
  ): Promise<PostDtoType | null> {
    const _id = new ObjectId();

    const blog = await this.blogsRepository.findBlog(blogId);
    if (!blog) return null;

    const blogName = blog!.name;
    const newPost = { title, shortDescription, content, blogId, blogName, createdAt };
    await this.model.insertOne({ _id, ...newPost });
    const id = _id.toString();
    return { id, ...newPost };
  }

  async updatePost(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const updateResult = await this.model.updateOne(
      { _id },
      { $set: { title, shortDescription, content, blogId } },
    );
    return updateResult.matchedCount > 0;
  }

  async deletePost(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const deleteResult = await this.model.deleteOne({ _id });
    return deleteResult.deletedCount > 0;
  }
}
