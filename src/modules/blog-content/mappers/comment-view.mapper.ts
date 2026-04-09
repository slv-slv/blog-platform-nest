import { Comment } from '../infrastructure/typeorm/entities/comment.entity.js';
import { CommentViewModel } from '../types/comments.types.js';
import { createDefaultCommentLikesInfo } from '../helpers/create-default-comment-likes-info.js';

export const mapCommentToViewModel = (comment: Comment, userLogin: string): CommentViewModel => {
  return {
    id: comment.id.toString(),
    content: comment.content,
    commentatorInfo: {
      userId: comment.userId.toString(),
      userLogin,
    },
    createdAt: comment.createdAt.toISOString(),
    likesInfo: createDefaultCommentLikesInfo(),
  };
};
