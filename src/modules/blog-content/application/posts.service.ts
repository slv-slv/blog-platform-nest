import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/sql/posts.repository.js';
import { PostViewType } from '../types/posts.types.js';
import { PostLikesService } from './post-likes.service.js';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesService: PostLikesService,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<PostViewType> {
    const blog = await this.blogsRepository.findBlog(blogId);
    const blogName = blog.name;

    const createdAt = new Date().toISOString();
    const newPost = await this.postsRepository.createPost(
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      createdAt,
    );

    // const postId = newPost.id;
    // await this.postLikesService.createEmptyLikesInfo(postId);
    const extendedLikesInfo = this.postLikesService.getDefaultLikesInfo();

    return { ...newPost, extendedLikesInfo };
  }

  async updatePost(
    postId: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<void> {
    await this.blogsRepository.findBlog(blogId);

    await this.postsRepository.updatePost(postId, title, shortDescription, content);
  }

  async deletePost(blogId: string, postId: string): Promise<void> {
    await this.blogsRepository.findBlog(blogId);

    await this.postsRepository.deletePost(postId);

    // await this.postLikesService.deleteLikesInfo(postId);
  }
}
