import { WithId } from 'mongodb';
import { LikesInfoViewType } from '../likes/types/likes.types.js';
import { IsString, Length } from 'class-validator';

export class CreateCommentInputDto {
  @IsString()
  @Length(20, 300)
  content: string;
}

export class UpdateCommentInputDto {
  @IsString()
  @Length(20, 300)
  content: string;
}

export type CommentDtoType = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoType;
  createdAt: string;
};

export type CommentViewType = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoType;
  createdAt: string;
  likesInfo: LikesInfoViewType;
};

export type CommentDbType = WithId<{
  postId: string;
  content: string;
  commentatorInfo: CommentatorInfoType;
  createdAt: string;
}>;

export type CommentatorInfoType = {
  userId: string;
  userLogin: string;
};

export enum CommentTypeKeys {
  content = 'content',
  commentatorInfo = 'commentatorInfo',
  createdAt = 'createdAt',
}

export type CommentsPaginatedType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: CommentViewType[];
};
