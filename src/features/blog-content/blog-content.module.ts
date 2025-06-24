import { Module } from '@nestjs/common';
import { BlogsController } from './01-blogs/api/blogs.controller.js';
import { BlogsService } from './01-blogs/application/blogs.service.js';
import { BlogsRepository } from './01-blogs/repositories/postgresql/blogs.repository.js';
import { BlogsQueryRepository } from './01-blogs/repositories/postgresql/blogs.query-repository.js';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Blog, BlogSchema } from './blogs/repositories/mongoose/blogs.schemas.js';
// import { Post, PostSchema } from './posts/repositories/mongoose/posts.schemas.js';
// import { Comment, CommentSchema } from './comments/repositories/mongoose/comments.schemas.js';
// import {
//   CommentLikes,
//   CommentLikesSchema,
// } from './likes/comments/repositories/mongoose/comment-likes.schemas.js';
// import { PostLikes, PostLikesSchema } from './likes/posts/repositories/mongoose/post-likes.schemas.js';
import { PostsController } from './02-posts/api/posts.controller.js';
import { PostsService } from './02-posts/application/posts.service.js';
import { PostsRepository } from './02-posts/repositories/postgresql/posts.repository.js';
import { PostsQueryRepository } from './02-posts/repositories/postgresql/posts.query-repository.js';
import { CommentsController } from './03-comments/api/comments.controller.js';
import { CommentsService } from './03-comments/application/comments.service.js';
import { CommentsRepository } from './03-comments/repositories/postgresql/comments.repository.js';
import { CommentsQueryRepository } from './03-comments/repositories/postgresql/comments.query-repository.js';
import { PostLikesService } from './04-likes/posts/application/post-likes.service.js';
import { PostLikesRepository } from './04-likes/posts/repositories/postgresql/post-likes.repository.js';
import { PostLikesQueryRepository } from './04-likes/posts/repositories/postgresql/post-likes.query-repository.js';
import { CommentLikesService } from './04-likes/comments/application/comment-likes.service.js';
import { CommentLikesRepository } from './04-likes/comments/repositories/postgresql/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './04-likes/comments/repositories/postgresql/comment-likes.query-repository.js';
import { UserAccountsModule } from '../user-accounts/user-accounts.module.js';
import { BlogsSuperadminController } from './01-blogs/api/blogs.superadmin.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './01-blogs/repositories/typeorm/blogs.entities.js';
import { Post } from './02-posts/repositories/typeorm/posts.entities.js';
import { Comment } from './03-comments/repositories/typeorm/comments.entities.js';
import { PostDislike, PostLike } from './04-likes/posts/repositories/typeorm/post-likes.entities.js';
import {
  CommentDislike,
  CommentLike,
} from './04-likes/comments/repositories/typeorm/comment-likes.entities.js';

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
