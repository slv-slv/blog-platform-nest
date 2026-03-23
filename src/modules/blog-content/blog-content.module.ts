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
import { CreateBlogUseCase } from './application/use-cases/create-blog.use-case.js';
import { UpdateBlogUseCase } from './application/use-cases/update-blog.use-case.js';
import { DeleteBlogUseCase } from './application/use-cases/delete-blog.use-case.js';
import { CreatePostUseCase } from './application/use-cases/create-post.use-case.js';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case.js';
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case.js';
import { CreateCommentUseCase } from './application/use-cases/create-comment.use-case.js';
import { UpdateCommentUseCase } from './application/use-cases/update-comment.use-case.js';
import { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case.js';
import { SetPostLikeStatusUseCase } from './application/use-cases/set-post-like-status.use-case.js';
import { SetCommentLikeStatusUseCase } from './application/use-cases/set-comment-like-status.use-case.js';
import { GetBlogsUseCase } from './application/use-cases/get-blogs.use-case.js';
import { GetBlogUseCase } from './application/use-cases/get-blog.use-case.js';
import { GetPostUseCase } from './application/use-cases/get-post.use-case.js';
import { GetPostsUseCase } from './application/use-cases/get-posts.use-case.js';

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
    GetPostsUseCase,
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
