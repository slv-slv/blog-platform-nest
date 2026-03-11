import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';
import { BlogType } from '../types/blogs.types.js';

@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async createBlog(name: string, description: string, websiteUrl: string): Promise<BlogType> {
    const createdAt = new Date().toISOString();
    const isMembership = false;
    return await this.blogsRepository.createBlog(name, description, websiteUrl, createdAt, isMembership);
  }

  async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<void> {
    await this.blogsRepository.updateBlog(id, name, description, websiteUrl);
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.deleteBlog(id);
  }
}
