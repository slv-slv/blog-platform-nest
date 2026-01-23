import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/typeorm/posts.repository.js';
import { PostViewType } from '../types/posts.types.js';
import { PostLikesService } from '../../04-likes/posts/application/post-likes.service.js';
import { BlogsRepository } from '../../01-blogs/repositories/postgresql/blogs.repository.js';

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
    if (!blog) throw new NotFoundException('Blog not found');
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
    const blog = await this.blogsRepository.findBlog(blogId);
    if (!blog) throw new NotFoundException('Blog not found');

    const updateResult = await this.postsRepository.updatePost(postId, title, shortDescription, content);
    if (!updateResult) throw new NotFoundException('Post not found');
  }

  async deletePost(blogId: string, postId: string): Promise<void> {
    const blog = await this.blogsRepository.findBlog(blogId);
    if (!blog) throw new NotFoundException('Blog not found');

    const deleteResult = await this.postsRepository.deletePost(postId);
    if (!deleteResult) throw new NotFoundException('Post not found');

    // await this.postLikesService.deleteLikesInfo(postId);
  }
}
