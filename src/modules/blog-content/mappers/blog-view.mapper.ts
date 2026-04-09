import { Blog } from '../infrastructure/typeorm/entities/blog.entity.js';
import { BlogViewModel } from '../types/blogs.types.js';

export const mapBlogToViewModel = (blog: Blog): BlogViewModel => {
  return {
    id: blog.id.toString(),
    name: blog.name,
    description: blog.description,
    websiteUrl: blog.websiteUrl,
    createdAt: blog.createdAt.toISOString(),
    isMembership: blog.isMembership,
  };
};
