import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export type LikesInfoViewType = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
};

export type ExtendedLikesInfoViewType = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: {
    addedAt: string;
    userId: string;
    login: string;
  }[];
};

export type GetPostLikesInfoParams<TPostId> = {
  postIds: TPostId[];
  userId?: string;
};

// mongoose only
export type GetSinglePostLikesInfoParams = {
  postId: string;
  userId?: string;
};

export type GetCommentLikesInfoParams<TCommentId> = {
  commentIds: TCommentId[];
  userId?: string;
};

// mongoose only
export type GetSingleCommentLikesInfoParams = {
  commentId: string;
  userId?: string;
};

export class SetLikeStatusDto {
  @IsEnum(LikeStatus)
  declare likeStatus: LikeStatus;
}

export type SetPostLikeStatusParams = {
  postId: string;
  userId: string;
  likeStatus: LikeStatus;
};

export type SetCommentLikeStatusParams = {
  commentId: string;
  userId: string;
  likeStatus: LikeStatus;
};
