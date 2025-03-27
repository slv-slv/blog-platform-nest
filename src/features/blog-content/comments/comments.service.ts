import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CommentViewType } from './comment.types.js';
import { PostsRepository } from '../posts/posts.repository.js';
import { UsersRepository } from '../../user-accounts/users/users.repository.js';
import { CommentsRepository } from './comments.repository.js';
import { CommentLikesService } from '../likes/comments/comment-likes.service.js';

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    private postsRepository: PostsRepository,
    private usersRepository: UsersRepository,
    private commentLikesService: CommentLikesService,
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

  // async updateComment(commentId: string, content: string, userId: string): Promise<Result<null>> {
  //   const comment = await this.commentsRepo.findComment(commentId);
  //   if (!comment) {
  //     return {
  //       status: RESULT_STATUS.NOT_FOUND,
  //       errorMessage: 'Not Found',
  //       extensions: [{ message: 'Comment not found', field: 'commentId' }],
  //       data: null,
  //     };
  //   }
  //   const ownerId = comment.commentatorInfo.userId;
  //   if (userId !== ownerId) {
  //     return {
  //       status: RESULT_STATUS.FORBIDDEN,
  //       errorMessage: 'Forbidden',
  //       extensions: [{ message: 'Invalid userId', field: 'userId' }],
  //       data: null,
  //     };
  //   }
  //   await this.commentsRepo.updateComment(commentId, content);
  //   return {
  //     status: RESULT_STATUS.NO_CONTENT,
  //     data: null,
  //   };
  // }
  // async deleteComment(commentId: string, userId: string): Promise<Result<null>> {
  //   const comment = await this.commentsRepo.findComment(commentId);
  //   if (!comment) {
  //     return {
  //       status: RESULT_STATUS.NOT_FOUND,
  //       errorMessage: 'Not Found',
  //       extensions: [{ message: 'Comment not found', field: 'commentId' }],
  //       data: null,
  //     };
  //   }
  //   const ownerId = comment.commentatorInfo.userId;
  //   if (userId !== ownerId) {
  //     return {
  //       status: RESULT_STATUS.FORBIDDEN,
  //       errorMessage: 'Forbidden',
  //       extensions: [{ message: 'Invalid userId', field: 'userId' }],
  //       data: null,
  //     };
  //   }
  //   await this.commentsRepo.deleteComment(commentId);
  //   await this.commentLikesService.deleteLikesInfo(commentId);
  //   return {
  //     status: RESULT_STATUS.NO_CONTENT,
  //     data: null,
  //   };
  // }
}
