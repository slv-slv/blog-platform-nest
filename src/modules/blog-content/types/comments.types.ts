import { WithId } from 'mongodb';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { LikesInfoViewModel } from './likes.types.js';
import { Trim } from '../../../common/decorators/trim.js';
import { BasicPagingParams, PagingParamsType } from '../../../common/types/paging-params.types.js';

export type CommentModel = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoModel;
  createdAt: string;
};

export type CommentViewModel = CommentModel & {
  likesInfo: LikesInfoViewModel;
};

export type CommentatorInfoModel = {
  userId: string;
  userLogin: string;
};

export enum CommentsSortBy {
  content = 'content',
  commentatorInfo = 'commentatorInfo',
  createdAt = 'createdAt',
}

export type CommentsPaginatedViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: CommentViewModel[];
};

export class CreateCommentInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  @Length(20, 300)
  declare content: string;
}

export class UpdateCommentInputDto extends CreateCommentInputDto {}

export class GetCommentsQueryParams extends BasicPagingParams {
  @IsOptional()
  @IsEnum(CommentsSortBy)
  sortBy: CommentsSortBy = CommentsSortBy.createdAt;
}

export type CreateCommentParams = {
  postId: string;
  content: string;
  userId: string;
};

export type UpdateCommentParams = {
  commentId: string;
  content: string;
  userId: string;
};

export type DeleteCommentParams = {
  commentId: string;
  userId: string;
};

export type FindCommentRepoQueryParams = {
  commentId: string;
  userId?: string;
};

export type GetCommentsRepoQueryParams = {
  postId: string;
  userId?: string;
  pagingParams: PagingParamsType;
};

export type CreateCommentRepoParams = {
  postId: string;
  content: string;
  createdAt: Date;
  commentatorInfo: CommentatorInfoModel;
};

export type UpdateCommentRepoParams = {
  id: string;
  content: string;
};

// mongoose only
export type CommentDbType = WithId<{
  postId: string;
  content: string;
  commentatorInfo: CommentatorInfoModel;
  createdAt: string;
}>;
