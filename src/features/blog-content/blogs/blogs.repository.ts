import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from './blogs.schema.js';
import { Model } from 'mongoose';
import { BlogType } from './blogs.types.js';
import { ObjectId } from 'mongodb';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private model: Model<Blog>) {}

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

  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
    createdAt: string,
    isMembership: boolean,
  ): Promise<BlogType> {
    const _id = new ObjectId();
    const newBlog = { name, description, websiteUrl, createdAt, isMembership };
    await this.model.insertOne({ _id, ...newBlog });
    const id = _id.toString();
    return { id, ...newBlog };
  }

  async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const updateResult = await this.model.updateOne({ _id }, { $set: { name, description, websiteUrl } });
    if (!updateResult.matchedCount) {
      return false;
    }
    return true;
  }

  async deleteBlog(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const deleteResult = await this.model.deleteOne({ _id });
    if (!deleteResult.deletedCount) {
      return false;
    }
    return true;
  }
}
