import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsController } from './api/blogs.controller.js';
import { BlogsRepository } from './infrastructure/typeorm/blogs.repository.js';
import { BlogsQueryRepository } from './infrastructure/typeorm/blogs.query-repository.js';
import { PostsController } from './api/posts.controller.js';
import { PostsRepository } from './infrastructure/typeorm/posts.repository.js';
import { PostsQueryRepository } from './infrastructure/typeorm/posts.query-repository.js';
import { CommentsController } from './api/comments.controller.js';
import { CommentsRepository } from './infrastructure/typeorm/comments.repository.js';
import { CommentsQueryRepository } from './infrastructure/typeorm/comments.query-repository.js';
import { PostReactionsRepository } from './infrastructure/typeorm/post-reactions.repository.js';
import { PostReactionsQueryRepository } from './infrastructure/typeorm/post-reactions.query-repository.js';
import { CommentReactionsRepository } from './infrastructure/typeorm/comment-reactions.repository.js';
import { CommentReactionsQueryRepository } from './infrastructure/typeorm/comment-reactions.query-repository.js';
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
import { GetCommentUseCase } from './application/use-cases/get-comment.use-case.js';
import { GetCommentsUseCase } from './application/use-cases/get-comments.use-case.js';
import { Blog } from './infrastructure/typeorm/entities/blog.entity.js';
import { CommentDislike } from './infrastructure/typeorm/entities/comment-dislike.entity.js';
import { CommentLike } from './infrastructure/typeorm/entities/comment-like.entity.js';
import { Comment } from './infrastructure/typeorm/entities/comment.entity.js';
import { PostDislike } from './infrastructure/typeorm/entities/post-dislike.entity.js';
import { PostLike } from './infrastructure/typeorm/entities/post-like.entity.js';
import { Post } from './infrastructure/typeorm/entities/post.entity.js';

@Module({
  imports: [
    UserAccountsModule,
    TypeOrmModule.forFeature([Blog, Post, Comment, PostLike, PostDislike, CommentLike, CommentDislike]),
  ],
  controllers: [BlogsController, BlogsSuperadminController, PostsController, CommentsController],
  providers: [
    BlogsRepository,
    BlogsQueryRepository,
    PostsRepository,
    PostsQueryRepository,
    CommentsRepository,
    CommentsQueryRepository,
    PostReactionsRepository,
    PostReactionsQueryRepository,
    CommentReactionsRepository,
    CommentReactionsQueryRepository,
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
    GetCommentUseCase,
    GetCommentsUseCase,
    CreateCommentUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    SetPostLikeStatusUseCase,
    SetCommentLikeStatusUseCase,
  ],
  exports: [],
})
export class BlogContentModule {}
