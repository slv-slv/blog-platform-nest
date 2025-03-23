import { Injectable } from '@nestjs/common';

@Injectable()
export class CommentsService {
  // async createComment(
  //   postId: string,
  //   content: string,
  //   userId: string,
  // ): Promise<Result<CommentViewType | null>> {
  //   const post = await this.postsRepo.findPost(postId);
  //   if (!post) {
  //     return {
  //       status: RESULT_STATUS.NOT_FOUND,
  //       errorMessage: 'Not found',
  //       extensions: [{ message: 'Post not found', field: 'postId' }],
  //       data: null,
  //     };
  //   }
  //   const createdAt = new Date().toISOString();
  //   const userLogin = await this.usersRepo.getLogin(userId);
  //   if (!userLogin) {
  //     return {
  //       status: RESULT_STATUS.UNAUTHORIZED,
  //       errorMessage: 'Unauthorized',
  //       extensions: [{ message: 'Access denied', field: 'userId' }],
  //       data: null,
  //     };
  //   }
  //   const commentatorInfo = { userId, userLogin };
  //   const newComment = await this.commentsRepo.createComment(postId, content, createdAt, commentatorInfo);
  //   const commentId = newComment.id;
  //   await this.commentLikesService.createLikesInfo(commentId);
  //   const likesInfo = this.commentLikesService.getDefaultLikesInfo();
  //   return {
  //     status: RESULT_STATUS.CREATED,
  //     data: { ...newComment, likesInfo },
  //   };
  // }
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
