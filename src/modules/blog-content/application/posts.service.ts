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

  // async updatePost(params: UpdatePostParams): Promise<void> {
  //   const { postId, title, shortDescription, content, blogId } = params;
  //   await this.blogsRepository.checkBlogExists(blogId);

  //   const repoParams: UpdatePostRepoParams = { id: postId, title, shortDescription, content };
  //   await this.postsRepository.updatePost(repoParams);
  // }

  async deletePost(params: DeletePostParams): Promise<void> {
    const { blogId, postId } = params;
    await this.blogsRepository.checkBlogExists(blogId);
    await this.postsRepository.deletePost(postId);
  }
}
