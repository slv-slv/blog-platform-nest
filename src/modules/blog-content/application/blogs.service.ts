import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';
import { BlogType, CreateBlogParams, CreateBlogRepoParams, UpdateBlogParams } from '../types/blogs.types.js';

@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async createBlog(params: CreateBlogParams): Promise<BlogType> {
    const { name, description, websiteUrl } = params;
    const createdAt = new Date().toISOString();
    const isMembership = false;

    const repoParams: CreateBlogRepoParams = { name, description, websiteUrl, createdAt, isMembership };
    return await this.blogsRepository.createBlog(repoParams);
  }

  async updateBlog(params: UpdateBlogParams): Promise<void> {
    await this.blogsRepository.updateBlog(params);
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.deleteBlog(id);
  }
}
