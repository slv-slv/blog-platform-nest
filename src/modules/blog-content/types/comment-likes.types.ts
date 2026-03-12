import { WithId } from 'mongodb';
import { LikeRecordType } from '../infrastructure/mongoose/like-record-schema.js';

export type CommentLikesType = {
  commentId: string;
  likes: LikeRecordType[];
  dislikes: LikeRecordType[];
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
export type CommentLikesDbType = WithId<CommentLikesType>;
