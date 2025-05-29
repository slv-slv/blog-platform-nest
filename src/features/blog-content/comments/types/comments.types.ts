import { WithId } from 'mongodb';
import { LikesInfoViewType } from '../../likes/types/likes.types.js';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { BasicPagingParams } from '../../../../common/types/paging-params.types.js';
import { Trim } from '../../../../common/decorators/trim.js';

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

export enum CommentsSortBy {
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

export class CreateCommentInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  @Length(20, 300)
  content: string;
}

export class UpdateCommentInputDto extends CreateCommentInputDto {}

export class GetCommentsQueryParams extends BasicPagingParams {
  @IsOptional()
  @IsEnum(CommentsSortBy)
  sortBy: CommentsSortBy = CommentsSortBy.createdAt;
}
