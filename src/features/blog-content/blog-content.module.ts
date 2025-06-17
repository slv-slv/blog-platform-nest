import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/api/blogs.controller.js';
import { BlogsService } from './blogs/application/blogs.service.js';
import { BlogsRepository } from './blogs/repositories/postgresql/blogs.repository.js';
import { BlogsQueryRepository } from './blogs/repositories/postgresql/blogs.query-repository.js';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Blog, BlogSchema } from './blogs/repositories/mongoose/blogs.schemas.js';
// import { Post, PostSchema } from './posts/repositories/mongoose/posts.schemas.js';
// import { Comment, CommentSchema } from './comments/repositories/mongoose/comments.schemas.js';
// import {
//   CommentLikes,
//   CommentLikesSchema,
// } from './likes/comments/repositories/mongoose/comment-likes.schemas.js';
// import { PostLikes, PostLikesSchema } from './likes/posts/repositories/mongoose/post-likes.schemas.js';
import { PostsController } from './posts/api/posts.controller.js';
import { PostsService } from './posts/application/posts.service.js';
import { PostsRepository } from './posts/repositories/postgresql/posts.repository.js';
import { PostsQueryRepository } from './posts/repositories/postgresql/posts.query-repository.js';
import { CommentsController } from './comments/api/comments.controller.js';
import { CommentsService } from './comments/application/comments.service.js';
import { CommentsRepository } from './comments/repositories/postgresql/comments.repository.js';
import { CommentsQueryRepository } from './comments/repositories/postgresql/comments.query-repository.js';
import { PostLikesService } from './likes/posts/application/post-likes.service.js';
import { PostLikesRepository } from './likes/posts/repositories/postgresql/post-likes.repository.js';
import { PostLikesQueryRepository } from './likes/posts/repositories/postgresql/post-likes.query-repository.js';
import { CommentLikesService } from './likes/comments/application/comment-likes.service.js';
import { CommentLikesRepository } from './likes/comments/repositories/postgresql/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './likes/comments/repositories/postgresql/comment-likes.query-repository.js';
import { UserAccountsModule } from '../user-accounts/user-accounts.module.js';
import { BlogsSuperadminController } from './blogs/api/blogs.superadmin.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './blogs/repositories/typeorm/blogs.entities.js';
import { Post } from './posts/repositories/typeorm/posts.entities.js';
import { Comment } from './comments/repositories/typeorm/comments.entities.js';
import { PostDislike, PostLike } from './likes/posts/repositories/typeorm/post-likes.entities.js';
import { CommentDislike, CommentLike } from './likes/comments/repositories/typeorm/comment-likes.entities.js';

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
