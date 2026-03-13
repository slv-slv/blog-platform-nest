import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from './blogs.schemas.js';
import { Model } from 'mongoose';
import { BlogType, CreateBlogRepoParams, UpdateBlogRepoParams } from '../../types/blogs.types.js';
import { ObjectId } from 'mongodb';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private readonly model: Model<Blog>) {}

  async findBlog(id: string): Promise<BlogType | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const blog = await this.model.findOne({ _id }, { _id: 0 }).lean();
    if (!blog) {
      return null;
    }
    return { id, ...blog };
  }

  async createBlog(params: CreateBlogRepoParams): Promise<BlogType> {
    const { name, description, websiteUrl, createdAt, isMembership } = params;
    const newBlog = { name, description, websiteUrl, createdAt, isMembership };
    const insertedBlog = await this.model.create(newBlog);
    const id = insertedBlog._id.toString();
    return { id, ...newBlog };
  }

  async updateBlog(params: UpdateBlogRepoParams): Promise<boolean> {
    const { id, name, description, websiteUrl } = params;
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const updateResult = await this.model.updateOne(
      { _id },
      { $set: { name, description, websiteUrl } },
      { runValidators: true },
    );
    return updateResult.matchedCount > 0;
  }

  async deleteBlog(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const deleteResult = await this.model.deleteOne({ _id });
    return deleteResult.deletedCount > 0;
  }
}
