import { WithId } from 'mongodb';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ExtendedLikesInfoViewModel } from './likes.types.js';
import { Trim } from '../../../common/decorators/trim.js';
import { BasicPagingParams, PagingParamsType } from '../../../common/types/paging-params.types.js';

export type PostModel = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
};

export type PostViewModel = PostModel & {
  extendedLikesInfo: ExtendedLikesInfoViewModel;
};

export enum PostsSortBy {
  title = 'title',
  shortDescription = 'shortDescription',
  content = 'content',
  blogId = 'blogId',
  blogName = 'blogName',
  createdAt = 'createdAt',
}

export type PostsPaginatedViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostViewModel[];
};

export class CreatePostInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(30)
  declare title: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(100)
  declare shortDescription: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(1000)
  declare content: string;
}

export class UpdatePostInputDto extends CreatePostInputDto {}

export class CreatePostForBlogInputDto extends CreatePostInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  declare blogId: string;
}

export class UpdatePostForBlogInputDto extends CreatePostForBlogInputDto {}

export class GetPostsQueryParams extends BasicPagingParams {
  @IsOptional()
  @IsEnum(PostsSortBy)
  sortBy: PostsSortBy = PostsSortBy.createdAt;
}

export type CreatePostParams = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
};

export type UpdatePostParams = CreatePostParams & {
  postId: string;
};

export type DeletePostParams = {
  blogId: string;
  postId: string;
};

export type FindPostRepoQueryParams = {
  postId: string;
  userId?: string;
};

export type GetPostsRepoQueryParams = {
  pagingParams: PagingParamsType;
  userId?: string;
  blogId?: string;
};

export type CreatePostRepoParams = CreatePostParams & {
  blogName: string;
  createdAt: Date;
};

export type UpdatePostRepoParams = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
};

// mongoose only
export type PostDbType = WithId<{
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
}>;
