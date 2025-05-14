import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/api/blogs.controller.js';
import { BlogsService } from './blogs/application/blogs.service.js';
import { BlogsRepository } from './blogs/infrastructure/mongoose/blogs.repository.js';
import { BlogsQueryRepository } from './blogs/infrastructure/mongoose/blogs.query-repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/infrastructure/mongoose/blogs.schemas.js';
import { PostsController } from './posts/api/posts.controller.js';
import { PostsService } from './posts/application/posts.service.js';
import { PostsRepository } from './posts/infrastructure/mongoose/posts.repository.js';
import { PostsQueryRepository } from './posts/infrastructure/mongoose/posts.query-repository.js';
import { Post, PostSchema } from './posts/infrastructure/mongoose/posts.schemas.js';
import { CommentsController } from './comments/api/comments.controller.js';
import { CommentsService } from './comments/application/comments.service.js';
import { CommentsRepository } from './comments/infrastructure/mongoose/comments.repository.js';
import { CommentsQueryRepository } from './comments/infrastructure/mongoose/comments.query-repository.js';
import { Comment, CommentSchema } from './comments/infrastructure/mongoose/comments.schemas.js';
import { PostLikesService } from './likes/posts/application/post-likes.service.js';
import { PostLikesRepository } from './likes/posts/infrastructure/mongoose/post-likes.repository.js';
import { PostLikesQueryRepository } from './likes/posts/infrastructure/mongoose/post-likes.query-repository.js';
import { CommentLikesService } from './likes/comments/application/comment-likes.service.js';
import { CommentLikesRepository } from './likes/comments/infrastructure/mongoose/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './likes/comments/infrastructure/mongoose/comment-likes.query-repository.js';
import {
  CommentLikes,
  CommentLikesSchema,
} from './likes/comments/infrastructure/mongoose/comment-likes.schemas.js';
import { PostLikes, PostLikesSchema } from './likes/posts/infrastructure/mongoose/post-likes.schemas.js';
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
