import { Inject, Injectable } from '@nestjs/common';
import { BlogType } from '../../types/blogs.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './blogs.entities.js';
import { Repository } from 'typeorm';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>) {}

  async findBlog(id: string): Promise<BlogType | null> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const blog = await this.blogEntityRepository
      .createQueryBuilder('blog')
      .where('blog.id = :id', { id: idNum })
      .getOne();

    if (!blog) return null;
    return blog.toDto();
  }

  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
    createdAt: string,
    isMembership: boolean,
  ): Promise<BlogType> {
    // const newBlog = { name, description, websiteUrl, createdAt, isMembership };

    const result = await this.blogEntityRepository
      .createQueryBuilder()
      .insert()
      .into(Blog)
      .values({ name, description, websiteUrl, createdAt, isMembership })
      .execute();

    const id = result.identifiers[0].id.toString();
    return { id, name, description, websiteUrl, createdAt, isMembership };
  }

  async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
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
}
