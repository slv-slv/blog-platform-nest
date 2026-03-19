import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';
import { BlogType, CreateBlogParams, CreateBlogRepoParams, UpdateBlogParams } from '../types/blogs.types.js';

@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async updateBlog(params: UpdateBlogParams): Promise<void> {
    await this.blogsRepository.updateBlog(params);
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.deleteBlog(id);
  }
}
