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
