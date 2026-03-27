import { WithId } from 'mongodb';
import { LikeRecordModel } from '../infrastructure/mongoose/like-record-schema.js';

export type CommentLikesModel = {
  commentId: string;
  likes: LikeRecordModel[];
  dislikes: LikeRecordModel[];
};

export type CommentLikeStatusRepoParams = {
  commentId: string;
  userId: string | null;
};

export type SetCommentLikeRepoParams = {
  commentId: string;
  userId: string;
  createdAt: Date;
};

export type SetCommentNoneRepoParams = {
  commentId: string;
  userId: string;
};

// mongoose only
export type CommentLikesDbType = WithId<CommentLikesModel>;
