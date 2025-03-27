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
import { Post, PostSchema } from './posts/posts.schema.js';
import { CommentsController } from './comments/comments.controller.js';
import { CommentsService } from './comments/comments.service.js';
import { CommentsRepository } from './comments/comments.repository.js';
import { CommentsQueryRepository } from './comments/comments.query-repository.js';
import { Comment, CommentSchema } from './comments/comments.schema.js';
import { PostLikesService } from './likes/posts/post-likes.service.js';
import { PostLikesRepository } from './likes/posts/post-likes.repository.js';
import { PostLikesQueryRepository } from './likes/posts/post-likes.query-repository.js';
import { CommentLikesService } from './likes/comments/comment-likes.service.js';
import { CommentLikesRepository } from './likes/comments/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './likes/comments/comment-likes.query-repository.js';
import { CommentLikes, CommentLikesSchema } from './likes/comments/comment-likes.schema.js';
import { PostLikes, PostLikesSchema } from './likes/posts/post-likes.schema.js';
import { UserAccountsModule } from '../user-accounts/user-accounts.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: CommentLikes.name, schema: CommentLikesSchema },
      { name: PostLikes.name, schema: PostLikesSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
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
