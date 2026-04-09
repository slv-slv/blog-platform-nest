import { Post } from '../infrastructure/typeorm/entities/post.entity.js';
import { PostViewModel } from '../types/posts.types.js';
import { createDefaultPostLikesInfo } from '../helpers/create-default-post-likes-info.js';

export const mapPostToViewModel = (post: Post, blogName: string): PostViewModel => {
  return {
    id: post.id.toString(),
    title: post.title,
    shortDescription: post.shortDescription,
    content: post.content,
    blogId: post.blogId.toString(),
    blogName,
    createdAt: post.createdAt.toISOString(),
    extendedLikesInfo: createDefaultPostLikesInfo(),
  };
};
