import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/sql/posts.repository.js';
import {
  CreatePostParams,
  CreatePostRepoParams,
  DeletePostParams,
  PostViewType,
  UpdatePostParams,
  UpdatePostRepoParams,
} from '../types/posts.types.js';
import { PostLikesService } from './post-likes.service.js';
import { BlogsRepository } from '../infrastructure/sql/blogs.repository.js';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesService: PostLikesService,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async createPost(params: CreatePostParams): Promise<PostViewType> {
    const { title, shortDescription, content, blogId } = params;
    const blog = await this.blogsRepository.findBlog(blogId);
    const blogName = blog.name;

    const createdAt = new Date().toISOString();
    const repoParams: CreatePostRepoParams = { title, shortDescription, content, blogId, blogName, createdAt };
    const newPost = await this.postsRepository.createPost(repoParams);

    // const postId = newPost.id;
    // await this.postLikesService.createEmptyLikesInfo(postId);
    const extendedLikesInfo = this.postLikesService.getDefaultLikesInfo();

    return { ...newPost, extendedLikesInfo };
  }

  async updatePost(params: UpdatePostParams): Promise<void> {
    const { postId, title, shortDescription, content, blogId } = params;
    await this.blogsRepository.findBlog(blogId);

    const repoParams: UpdatePostRepoParams = { id: postId, title, shortDescription, content };
    await this.postsRepository.updatePost(repoParams);
  }

  async deletePost(params: DeletePostParams): Promise<void> {
    const { blogId, postId } = params;
    await this.blogsRepository.findBlog(blogId);

    await this.postsRepository.deletePost(postId);

    // await this.postLikesService.deleteLikesInfo(postId);
  }
}
