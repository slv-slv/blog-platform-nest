import { Injectable } from '@nestjs/common';
import { CreatePostRepoParams, PostModel, UpdatePostRepoParams } from '../../types/posts.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './posts.entities.js';
import { Repository } from 'typeorm';
import {
  BlogNotFoundDomainException,
  PostNotFoundDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class PostsRepository {
  constructor(@InjectRepository(Post) private readonly postEntityRepository: Repository<Post>) {}

  async getPost(id: string): Promise<PostModel> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const post = await this.postEntityRepository.findOne({
      where: { id: +id },
      relations: { blog: true },
    });

    if (!post) {
      throw new PostNotFoundDomainException();
    }

    return this.mapToPostModel(post);
  }

  async checkPostExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const exists = await this.postEntityRepository.existsBy({ id: +id });

    if (!exists) {
      throw new PostNotFoundDomainException();
    }
  }

  async createPost(params: CreatePostRepoParams): Promise<PostModel> {
    const { title, shortDescription, content, blogId, blogName, createdAt } = params;
    if (!isPositiveIntegerString(blogId)) {
      throw new BlogNotFoundDomainException();
    }

    const result = await this.postEntityRepository.insert({
      blogId: +blogId,
      title,
      shortDescription,
      content,
      createdAt,
    });
    const id = result.identifiers[0].id.toString();

    return {
      id,
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      createdAt,
    };
  }

  async updatePost(params: UpdatePostRepoParams): Promise<boolean> {
    const { id, title, shortDescription, content } = params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) return false;

    const result = await this.postEntityRepository
      .createQueryBuilder()
      .update(Post)
      .set({ title, shortDescription, content })
      .where('id = :id', { id: idNum })
      .execute();

    return result.affected! > 0;
  }

  async deletePost(id: string): Promise<boolean> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return false;

    const result = await this.postEntityRepository
      .createQueryBuilder()
      .softDelete()
      .from(Post)
      .where('id = :id', { id: idNum })
      .execute();

    return result.affected! > 0;
  }

  private mapToPostModel(post: Post): PostModel {
    return {
      id: post.id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blog.name,
      createdAt: post.createdAt,
    };
  }
}
