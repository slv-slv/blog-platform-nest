import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/blogs.controller.js';
import { BlogsService } from './blogs/blogs.service.js';
import { BlogsRepository } from './blogs/blogs.repository.js';
import { BlogsQueryRepository } from './blogs/blogs.query-repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/blogs.schema.js';
import { PostsController } from './posts/posts.controller.js';
import { PostsService } from './posts/posts.service.js';
import { PostsRepository } from './posts/posts.repository.js';
import { PostsQueryRepository } from './posts/posts.query-repository.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }])],
  controllers: [BlogsController],
  providers: [
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    // PostsService,
    // PostsRepository,
    // PostsQueryRepository,
  ],
  exports: [BlogsService, BlogsRepository, BlogsQueryRepository], // Экспортируем BlogsService
})
export class BlogContentModule {}
