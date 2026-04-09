import { Injectable } from '@nestjs/common';
import { CreateBlogRepoParams, UpdateBlogRepoParams } from '../../types/blogs.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity.js';
import { Repository } from 'typeorm';
import { BlogNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>) {}

  async getBlog(id: string): Promise<Blog> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const blog = await this.blogEntityRepository.findOneBy({ id: +id });

    if (!blog) {
      throw new BlogNotFoundDomainException();
    }

    return blog;
  }

  async checkBlogExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const exists = await this.blogEntityRepository.existsBy({ id: +id });

    if (!exists) {
      throw new BlogNotFoundDomainException();
    }
  }

  async createBlog(params: CreateBlogRepoParams): Promise<Blog> {
    const { name, description, websiteUrl, createdAt, isMembership } = params;

    const blog = this.blogEntityRepository.create({
      name,
      description,
      websiteUrl,
      createdAt,
      isMembership,
    });

    return await this.blogEntityRepository.save(blog);
  }

  async updateBlog(params: UpdateBlogRepoParams): Promise<void> {
    const { id, name, description, websiteUrl } = params;

    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const result = await this.blogEntityRepository.update({ id: +id }, { name, description, websiteUrl });

    if (result.affected === 0) {
      throw new BlogNotFoundDomainException();
    }
  }

  async deleteBlog(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const result = await this.blogEntityRepository.softDelete({ id: +id });

    if (result.affected === 0) {
      throw new BlogNotFoundDomainException();
    }
  }
}
