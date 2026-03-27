import { Injectable } from '@nestjs/common';
import { BlogModel, CreateBlogRepoParams, UpdateBlogRepoParams } from '../../types/blogs.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './blogs.entities.js';
import { Repository } from 'typeorm';
import { BlogNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>) {}

  async getBlog(id: string): Promise<BlogModel> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const blog = await this.blogEntityRepository.findOneBy({ id: +id });

    if (!blog) {
      throw new BlogNotFoundDomainException();
    }

    return this.mapToBlogModel(blog);
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

  async createBlog(params: CreateBlogRepoParams): Promise<BlogModel> {
    const { name, description, websiteUrl, createdAt, isMembership } = params;
    const result = await this.blogEntityRepository.insert({
      name,
      description,
      websiteUrl,
      createdAt,
      isMembership,
    });

    const id = result.identifiers[0].id.toString();

    return {
      id,
      name,
      description,
      websiteUrl,
      createdAt,
      isMembership,
    };
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

  private mapToBlogModel(blog: Blog): BlogModel {
    return {
      id: blog.id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }
}
