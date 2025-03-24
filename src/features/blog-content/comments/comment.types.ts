import { WithId } from 'mongodb';
// import { LikesInfoViewType } from '../likes/types/likes-types.js';

export type CommentDtoType = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
};

export type CommentViewType = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  // likesInfo: LikesInfoViewType;
};

export type CommentDbType = WithId<{
  postId: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
}>;

export type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

export enum CommentTypeKeys {
  // id = 'id',
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
