import { WithId } from 'mongodb';
import { ExtendedLikesInfoViewType } from '../../likes/types/likes.types.js';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { BasicPagingParams } from '../../../../common/types/paging-params.types.js';
import { Trim } from '../../../../common/decorators/trim.js';

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
  @Trim()
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}

export class UpdatePostInputDto extends CreatePostInputDto {}

export class CreatePostForBlogInputDto extends CreatePostInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  blogId: string;
}

export class UpdatePostForBlogInputDto extends CreatePostForBlogInputDto {}

export class GetPostsQueryParams extends BasicPagingParams {
  @IsOptional()
  @IsEnum(PostsSortBy)
  sortBy: PostsSortBy = PostsSortBy.createdAt;
}
