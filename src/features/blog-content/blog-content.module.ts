import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/blogs.controller.js';
import { BlogsService } from './blogs/blogs.service.js';
import { BlogsRepository } from './blogs/blogs.repository.js';
import { BlogsQueryRepository } from './blogs/blogs.query-repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/blogs.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }])],
  controllers: [BlogsController],
  providers: [BlogsService, BlogsRepository, BlogsQueryRepository],
})
export class BlogContentModule {}
