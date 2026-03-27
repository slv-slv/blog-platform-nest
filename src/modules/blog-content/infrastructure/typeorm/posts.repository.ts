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

  async updatePost(params: UpdatePostRepoParams): Promise<void> {
    const { id, title, shortDescription, content } = params;

    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.postEntityRepository.update({ id: +id }, { title, shortDescription, content });

    if (result.affected === 0) {
      throw new PostNotFoundDomainException();
    }
  }

  async deletePost(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.postEntityRepository.softDelete({ id: +id });

    if (result.affected === 0) {
      throw new PostNotFoundDomainException();
    }
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
