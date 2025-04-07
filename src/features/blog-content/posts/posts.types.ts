import { WithId } from 'mongodb';
import { ExtendedLikesInfoViewType } from '../likes/types/likes.types.js';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BasicPagingParams } from '../../../common/types/paging-params.types.js';

export type PostDtoType = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
};

export type PostViewType = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewType;
};

export type PostDbType = WithId<{
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
}>;

export enum PostsSortBy {
  title = 'title',
  shortDescription = 'shortDescription',
  content = 'content',
  blogId = 'blogId',
  blogName = 'blogName',
  createdAt = 'createdAt',
}

export type PostsPaginatedType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostViewType[];
};

export class CreatePostInputDto {
  @IsString()
  @MaxLength(30)
  title: string;

  @IsString()
  @MaxLength(100)
  shortDescription: string;

  @IsString()
  @MaxLength(1000)
  content: string;

  @IsString()
  blogId: string;
}

export class UpdatePostInputDto extends CreatePostInputDto {}

export class GetPostsQueryParams extends BasicPagingParams {
  @IsOptional()
  @IsEnum(PostsSortBy)
  sortBy: PostsSortBy = PostsSortBy.createdAt;
}
