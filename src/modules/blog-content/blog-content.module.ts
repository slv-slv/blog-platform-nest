import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs.controller.js';
import { BlogsRepository } from './infrastructure/sql/blogs.repository.js';
import { BlogsQueryRepository } from './infrastructure/sql/blogs.query-repository.js';
import { PostsController } from './api/posts.controller.js';
import { PostsRepository } from './infrastructure/sql/posts.repository.js';
import { PostsQueryRepository } from './infrastructure/sql/posts.query-repository.js';
import { CommentsController } from './api/comments.controller.js';
import { CommentsRepository } from './infrastructure/sql/comments.repository.js';
import { CommentsQueryRepository } from './infrastructure/sql/comments.query-repository.js';
import { PostLikesRepository } from './infrastructure/sql/post-likes.repository.js';
import { PostLikesQueryRepository } from './infrastructure/sql/post-likes.query-repository.js';
import { CommentLikesRepository } from './infrastructure/sql/comment-likes.repository.js';
import { CommentLikesQueryRepository } from './infrastructure/sql/comment-likes.query-repository.js';
import { UserAccountsModule } from '../user-accounts/user-accounts.module.js';
import { BlogsSuperadminController } from './api/blogs.superadmin.controller.js';
import { CreateBlogUseCase } from './application/usecases/create-blog.use-case.js';
import { UpdateBlogUseCase } from './application/usecases/update-blog.use-case.js';
import { DeleteBlogUseCase } from './application/usecases/delete-blog.use-case.js';
import { CreatePostUseCase } from './application/usecases/create-post.use-case.js';
import { UpdatePostUseCase } from './application/usecases/update-post.use-case.js';
import { DeletePostUseCase } from './application/usecases/delete-post.use-case.js';
import { CreateCommentUseCase } from './application/usecases/create-comment.use-case.js';
import { UpdateCommentUseCase } from './application/usecases/update-comment.use-case.js';
import { DeleteCommentUseCase } from './application/usecases/delete-comment.use-case.js';
import { SetPostLikeStatusUseCase } from './application/usecases/set-post-like-status.use-case.js';
import { SetCommentLikeStatusUseCase } from './application/usecases/set-comment-like-status.use-case.js';
import { GetBlogsUseCase } from './application/usecases/get-blogs.use-case.js';
import { GetBlogUseCase } from './application/usecases/get-blog.use-case.js';
import { GetPostUseCase } from './application/usecases/get-post.use-case.js';

@Module({
  imports: [UserAccountsModule],
  controllers: [BlogsController, BlogsSuperadminController, PostsController, CommentsController],
  providers: [
    BlogsRepository,
    BlogsQueryRepository,
    PostsRepository,
    PostsQueryRepository,
    CommentsRepository,
    CommentsQueryRepository,
    PostLikesRepository,
    PostLikesQueryRepository,
    CommentLikesRepository,
    CommentLikesQueryRepository,
    GetBlogUseCase,
    GetBlogsUseCase,
    CreateBlogUseCase,
    UpdateBlogUseCase,
    DeleteBlogUseCase,
    GetPostUseCase,
    CreatePostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    CreateCommentUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    SetPostLikeStatusUseCase,
    SetCommentLikeStatusUseCase,
  ],
  exports: [],
})
export class BlogContentModule {}
