import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BlogsController } from './features/blog-content/blogs/blogs.controller.js';
import { SETTINGS } from './settings.js';
import { BlogContentModule } from './features/blog-content/blog-content.module.js';

@Module({
  imports: [MongooseModule.forRoot(SETTINGS.MONGO_URL), BlogContentModule],
  controllers: [AppController, BlogsController],
  providers: [AppService],
})
export class AppModule {}
