import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CommentViewType } from './comments.types.js';
import { PostsRepository } from '../posts/posts.repository.js';
import { UsersRepository } from '../../user-accounts/users/users.repository.js';
import { CommentsRepository } from './comments.repository.js';
import { CommentLikesService } from '../likes/comments/comment-likes.service.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly commentLikesService: CommentLikesService,
  ) {}
  async createComment(postId: string, content: string, userId: string): Promise<CommentViewType> {
    const post = await this.postsRepository.findPost(postId);
    if (!post) throw new NotFoundException('Post not found');

    const userLogin = await this.usersRepository.getLogin(userId);
    if (!userLogin) throw new UnauthorizedException('Access denied');

    const commentatorInfo = { userId, userLogin };
    const createdAt = new Date().toISOString();

    const newComment = await this.commentsRepository.createComment(
      postId,
      content,
      createdAt,
      commentatorInfo,
    );
    const commentId = newComment.id;
    await this.commentLikesService.createLikesInfo(commentId);
    const likesInfo = this.commentLikesService.getDefaultLikesInfo();
    return { ...newComment, likesInfo };
  }

  async updateComment(commentId: string, content: string, userId: string): Promise<void> {
    const comment = await this.commentsRepository.findComment(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const ownerId = comment.commentatorInfo.userId;
    if (userId !== ownerId) throw new ForbiddenException('Access denied');

    await this.commentsRepository.updateComment(commentId, content);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentsRepository.findComment(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const ownerId = comment.commentatorInfo.userId;
    if (userId !== ownerId) throw new ForbiddenException('Access denied');

    await this.commentsRepository.deleteComment(commentId);
    await this.commentLikesService.deleteLikesInfo(commentId);
  }
}
