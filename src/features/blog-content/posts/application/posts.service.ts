import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/mongoose/posts.repository.js';
import { PostViewType } from '../posts.types.js';
import { PostLikesService } from '../../likes/posts/application/post-likes.service.js';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesService: PostLikesService,
  ) {}

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<PostViewType> {
    const createdAt = new Date().toISOString();
    const newPost = await this.postsRepository.createPost(
      title,
      shortDescription,
      content,
      blogId,
      createdAt,
    );

    if (!newPost) throw new NotFoundException('Blog not found');

    const postId = newPost.id;
    await this.postLikesService.createLikesInfo(postId);
    const extendedLikesInfo = this.postLikesService.getDefaultLikesInfo();

    return { ...newPost, extendedLikesInfo };
  }

  async updatePost(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<void> {
    const updateResult = await this.postsRepository.updatePost(id, title, shortDescription, content, blogId);
    if (!updateResult) throw new NotFoundException('Post not found');
  }

  async deletePost(id: string): Promise<void> {
    const deleteResult = await this.postsRepository.deletePost(id);
    if (!deleteResult) throw new NotFoundException('Post not found');

    await this.postLikesService.deleteLikesInfo(id);
  }
}
