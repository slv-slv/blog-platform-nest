import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs.controller.js';
import { BlogsService } from './application/blogs.service.js';
import { BlogsRepository } from './infrastructure/typeorm/blogs.repository.js';
import { BlogsQueryRepository } from './infrastructure/typeorm/blogs.query-repository.js';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Blog, BlogSchema } from './infrastructure/mongoose/blogs.schemas.js';
// import { Post, PostSchema } from './infrastructure/mongoose/posts.schemas.js';
// import { Comment, CommentSchema } from './infrastructure/mongoose/comments.schemas.js';
// import {
//   CommentLikes,
//   CommentLikesSchema,
// } from './infrastructure/mongoose/comment-likes.schemas.js';
// import { PostLikes, PostLikesSchema } from './infrastructure/mongoose/post-likes.schemas.js';
import { PostsController } from './api/posts.controller.js';
import { PostsService } from './application/posts.service.js';
import { PostsRepository } from './infrastructure/typeorm/posts.repository.js';
import { PostsQueryRepository } from './infrastructure/typeorm/posts.query-repository.js';
import { CommentsController } from './api/comments.controller.js';
import { CommentsService } from './application/comments.service.js';
import { CommentsRepository } from './infrastructure/typeorm/comments.repository.js';
import { CommentsQueryRepository } from './infrastructure/typeorm/comments.query-repository.js';
import { PostLikesService } from './application/post-likes.service.js';
import { PostLikesRepository } from './infrastructure/typeorm/post-likes.repository.js';
import { PostLikesQueryRepository } from './infrastructure/typeorm/post-likes.query-repository.js';
import { CommentLikesService } from './application/comment-likes.service.js';
import { CommentLikesRepository } from './infrastructure/typeorm/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './infrastructure/typeorm/comment-likes.query-repository.js';
import { UserAccountsModule } from './user-accounts.module.js';
import { BlogsSuperadminController } from './api/blogs.superadmin.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './infrastructure/typeorm/blogs.entities.js';
import { Post } from './infrastructure/typeorm/posts.entities.js';
import { Comment } from './infrastructure/typeorm/comments.entities.js';
import { PostDislike, PostLike } from './infrastructure/typeorm/post-likes.entities.js';
import { CommentDislike, CommentLike } from './infrastructure/typeorm/comment-likes.entities.js';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   { name: Blog.name, schema: BlogSchema },
    //   { name: Post.name, schema: PostSchema },
    //   { name: Comment.name, schema: CommentSchema },
    //   { name: CommentLikes.name, schema: CommentLikesSchema },
    //   { name: PostLikes.name, schema: PostLikesSchema },
    // ]),
    TypeOrmModule.forFeature([Blog, Post, Comment, PostLike, PostDislike, CommentLike, CommentDislike]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, BlogsSuperadminController, PostsController, CommentsController],
  providers: [
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    CommentsService,
    CommentsRepository,
    CommentsQueryRepository,
    PostLikesService,
    PostLikesRepository,
    PostLikesQueryRepository,
    CommentLikesService,
    CommentLikesRepository,
    CommentLikesQueryRepository,
  ],
  exports: [],
})
export class BlogContentModule {}
