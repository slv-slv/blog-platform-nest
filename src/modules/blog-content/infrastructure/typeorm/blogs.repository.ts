import { Inject, Injectable } from '@nestjs/common';
import { BlogViewType, CreateBlogRepoParams, UpdateBlogRepoParams } from '../../types/blogs.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './blogs.entities.js';
import { Repository } from 'typeorm';
import { BlogNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>) {}

  async getBlog(id: string): Promise<BlogViewType> {
    if (!isPositiveIntegerString(id)) {
      throw new BlogNotFoundDomainException();
    }

    const blog = await this.blogEntityRepository
      .createQueryBuilder('blog')
      .where('blog.id = :id', { id: +id })
      .getOne();

    if (!blog) {
      throw new BlogNotFoundDomainException();
    }

    return this.mapToBlogViewType(blog);
  }

  async createBlog(params: CreateBlogRepoParams): Promise<BlogViewType> {
    const { name, description, websiteUrl, createdAt, isMembership } = params;
    // const newBlog = { name, description, websiteUrl, createdAt, isMembership };

    const result = await this.blogEntityRepository
      .createQueryBuilder()
      .insert()
      .into(Blog)
      .values({ name, description, websiteUrl, createdAt, isMembership })
      .execute();

    const id = result.identifiers[0].id.toString();
    return { id, name, description, websiteUrl, createdAt: createdAt.toISOString(), isMembership };
  }

  async updateBlog(params: UpdateBlogRepoParams): Promise<boolean> {
    const { id, name, description, websiteUrl } = params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) return false;

    const result = await this.blogEntityRepository
      .createQueryBuilder()
      .update(Blog)
      .set({ name, description, websiteUrl })
      .where('id = :id', { id: idNum })
      .execute();

    return result.affected! > 0;
  }

  async deleteBlog(id: string): Promise<boolean> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return false;

    const result = await this.blogEntityRepository
      .createQueryBuilder()
      .softDelete()
      .from(Blog)
      .where('id = :id', { id: idNum })
      .execute();

    return result.affected! > 0;
  }

  private mapToBlogViewType(blog: Blog): BlogViewType {
    return {
      id: blog.id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
  }
}
