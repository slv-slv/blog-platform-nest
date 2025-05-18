import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from './blogs.schemas.js';
import { Model } from 'mongoose';
import { BlogType } from '../../blogs.types.js';
import { ObjectId } from 'mongodb';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blog.name) private readonly model: Model<Blog>,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  // async findBlog(id: string): Promise<BlogType | null> {
  //   if (!ObjectId.isValid(id)) {
  //     return null;
  //   }
  //   const _id = new ObjectId(id);
  //   const blog = await this.model.findOne({ _id }, { _id: 0 }).lean();
  //   if (!blog) {
  //     return null;
  //   }
  //   return { id, ...blog };
  // }

  async findBlog(id: string): Promise<BlogType | null> {
    const result = await this.pool.query(
      `
        SELECT *
        FROM blogs
        WHERE id = $1
      `,
      [parseInt(id)],
    );

    if (result.rowCount === 0) {
      return null;
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

  // async createBlog(
  //   name: string,
  //   description: string,
  //   websiteUrl: string,
  //   createdAt: string,
  //   isMembership: boolean,
  // ): Promise<BlogType> {
  //   const _id = new ObjectId();
  //   const newBlog = { name, description, websiteUrl, createdAt, isMembership };
  //   await this.model.insertOne({ _id, ...newBlog });
  //   const id = _id.toString();
  //   return { id, ...newBlog };
  // }

  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
    createdAt: string,
    isMembership: boolean,
  ): Promise<BlogType> {
    const newBlog = { name, description, websiteUrl, createdAt, isMembership };

    const result = await this.pool.query(
      `
        INSERT INTO blogs (name, description, website_url, created_at, is_membership)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [name, description, websiteUrl, createdAt, isMembership],
    );

    const id = result.rows[0].toString();

    return { id, ...newBlog };
  }

  // async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
  //   if (!ObjectId.isValid(id)) {
  //     return false;
  //   }
  //   const _id = new ObjectId(id);
  //   const updateResult = await this.model.updateOne({ _id }, { $set: { name, description, websiteUrl } });
  //   return updateResult.matchedCount > 0;
  // }

  async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        UPDATE blogs
        SET name = $2, description = $3, website_url = $4
        WHERE id = $1
      `,
      [parseInt(id), name, description, websiteUrl],
    );

    return result.rowCount! > 0;
  }

  // async deleteBlog(id: string): Promise<boolean> {
  //   if (!ObjectId.isValid(id)) {
  //     return false;
  //   }
  //   const _id = new ObjectId(id);
  //   const deleteResult = await this.model.deleteOne({ _id });
  //   return deleteResult.deletedCount > 0;
  // }

  async deleteBlog(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        DELETE FROM blogs
        WHERE id = $1
      `,
      [parseInt(id)],
    );

    return result.rowCount! > 0;
  }
}
