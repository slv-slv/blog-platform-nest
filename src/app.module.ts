import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BlogsController } from './features/blog-content/blogs/blogs.controller.js';
import { SETTINGS } from './settings.js';
import { BlogContentModule } from './features/blog-content/blog-content.module.js';
import { PostsController } from './features/blog-content/posts/posts.controller.js';

@Module({
  imports: [ConfigModule.forRoot(), MongooseModule.forRoot(SETTINGS.MONGO_URL), BlogContentModule],
  controllers: [AppController, BlogsController, PostsController],
  providers: [AppService],
})
export class AppModule {}
