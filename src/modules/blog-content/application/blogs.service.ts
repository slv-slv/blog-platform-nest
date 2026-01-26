import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';
import { BlogType } from '../types/blogs.types.js';
import { BlogNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async createBlog(name: string, description: string, websiteUrl: string): Promise<BlogType> {
    const createdAt = new Date().toISOString();
    const isMembership = false;
    return await this.blogsRepository.createBlog(name, description, websiteUrl, createdAt, isMembership);
  }

  async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<void> {
    const updateResult = await this.blogsRepository.updateBlog(id, name, description, websiteUrl);
    if (!updateResult) throw new BlogNotFoundDomainException();
  }

  async deleteBlog(id: string): Promise<void> {
    const deleteResult = await this.blogsRepository.deleteBlog(id);
    if (!deleteResult) throw new BlogNotFoundDomainException();
  }
}
