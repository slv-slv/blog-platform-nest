import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs.controller.js';
import { BlogsService } from './application/blogs.service.js';
import { BlogsRepository } from './infrastructure/postgresql/blogs.repository.js';
import { BlogsQueryRepository } from './infrastructure/postgresql/blogs.query-repository.js';
import { PostsController } from './api/posts.controller.js';
import { PostsService } from './application/posts.service.js';
import { PostsRepository } from './infrastructure/postgresql/posts.repository.js';
import { PostsQueryRepository } from './infrastructure/postgresql/posts.query-repository.js';
import { CommentsController } from './api/comments.controller.js';
import { CommentsService } from './application/comments.service.js';
import { CommentsRepository } from './infrastructure/postgresql/comments.repository.js';
import { CommentsQueryRepository } from './infrastructure/postgresql/comments.query-repository.js';
import { PostLikesService } from './application/post-likes.service.js';
import { PostLikesRepository } from './infrastructure/postgresql/post-likes.repository.js';
import { PostLikesQueryRepository } from './infrastructure/postgresql/post-likes.query-repository.js';
import { CommentLikesService } from './application/comment-likes.service.js';
import { CommentLikesRepository } from './infrastructure/postgresql/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './infrastructure/postgresql/comment-likes.query-repository.js';
import { UserAccountsModule } from './user-accounts.module.js';
import { BlogsSuperadminController } from './api/blogs.superadmin.controller.js';

@Module({
  imports: [UserAccountsModule],
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
