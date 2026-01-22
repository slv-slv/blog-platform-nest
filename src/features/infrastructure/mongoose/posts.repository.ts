import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './posts.schemas.js';
import { ObjectId } from 'mongodb';
import { PostDtoType } from '../../types/posts.types.js';
import { BlogsRepository } from './blogs.repository.js';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<Post>,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async findPost(id: string): Promise<PostDtoType | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const post = await this.model.findOne({ _id }, { _id: 0 }).lean();
    if (!post) {
      return null;
    }
    return { id, ...post };
  }

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    blogName: string,
    createdAt: string,
  ): Promise<PostDtoType> {
    const newPost = { title, shortDescription, content, blogId, blogName, createdAt };
    const insertedPost = await this.model.create(newPost);
    const id = insertedPost._id.toString();
    return { id, ...newPost };
  }

  async updatePost(id: string, title: string, shortDescription: string, content: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const updateResult = await this.model.updateOne({ _id }, { $set: { title, shortDescription, content } });
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
