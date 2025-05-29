import { WithId } from 'mongodb';
import { LikeRecordType, LikeStatus } from '../../types/likes.types.js';

export type CommentLikesType = {
  commentId: string;
  likes: LikeRecordType[];
  dislikes: LikeRecordType[];
};

export type CommentLikesDbType = WithId<CommentLikesType>;
