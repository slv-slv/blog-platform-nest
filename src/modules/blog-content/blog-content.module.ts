import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs.controller.js';
import { BlogsService } from './application/blogs.service.js';
import { BlogsRepository } from './infrastructure/sql/blogs.repository.js';
import { BlogsQueryRepository } from './infrastructure/sql/blogs.query-repository.js';
import { PostsController } from './api/posts.controller.js';
import { PostsService } from './application/posts.service.js';
import { PostsRepository } from './infrastructure/sql/posts.repository.js';
import { PostsQueryRepository } from './infrastructure/sql/posts.query-repository.js';
import { CommentsController } from './api/comments.controller.js';
import { CommentsService } from './application/comments.service.js';
import { CommentsRepository } from './infrastructure/sql/comments.repository.js';
import { CommentsQueryRepository } from './infrastructure/sql/comments.query-repository.js';
import { PostLikesService } from './application/post-likes.service.js';
import { PostLikesRepository } from './infrastructure/sql/post-likes.repository.js';
import { PostLikesQueryRepository } from './infrastructure/sql/post-likes.query-repository.js';
import { CommentLikesService } from './application/comment-likes.service.js';
import { CommentLikesRepository } from './infrastructure/sql/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './infrastructure/sql/comment-likes.query-repository.js';
import { UserAccountsModule } from '../user-accounts/user-accounts.module.js';
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
