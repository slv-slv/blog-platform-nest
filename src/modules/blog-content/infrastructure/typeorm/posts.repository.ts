import { Inject, Injectable } from '@nestjs/common';
import { CreatePostRepoParams, PostModel, UpdatePostRepoParams } from '../../types/posts.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './posts.entities.js';
import { Repository } from 'typeorm';
import { Blog } from './blogs.entities.js';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Blog) private readonly blogEntityRepository: Repository<Blog>,
    @InjectRepository(Post) private readonly postEntityRepository: Repository<Post>,
  ) {}

  async getPost(id: string): Promise<PostModel | null> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const post = await this.postEntityRepository
      .createQueryBuilder('post')
      .where('post.id = :id', { id: idNum })
      .getOne();

    if (!post) return null;
    return post.toModel();
  }

  async createPost(params: CreatePostRepoParams): Promise<PostModel> {
    const { title, shortDescription, content, blogId, blogName, createdAt } = params;
    const blogIdNum = parseInt(blogId);

    // const result = await this.postEntityRepository
    //   .createQueryBuilder('post')
    //   .insert()
    //   .into(Post)
    //   .values({ title, shortDescription, content, blog: { id: blogIdNum }, createdAt })
    //   .execute();

    // const id = result.identifiers[0].toString();

    const post = this.postEntityRepository.create({
      title,
      shortDescription,
      content,
      blog: { id: blogIdNum },
      createdAt,
    });

    const savedPost = await this.postEntityRepository.save(post);
    const id = savedPost.id.toString();

    // так будет blogName запрашиваться в БД лишний раз
    // return savedPost.toModel();

    return {
      id,
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      createdAt: createdAt.toISOString(),
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
}
