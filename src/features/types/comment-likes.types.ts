import { WithId } from 'mongodb';
import { LikeRecordType } from './likes.types.js';

export type CommentLikesType = {
  commentId: string;
  likes: LikeRecordType[];
  dislikes: LikeRecordType[];
};

export type CommentLikesDbType = WithId<CommentLikesType>;
