import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { WithId } from 'mongodb';
import { Trim } from '../../../common/decorators/trim.js';
import { BasicPagingParams, PagingParamsType } from '../../../common/types/paging-params.types.js';

export type BlogType = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type BlogsPaginatedType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: BlogType[];
};

export enum BlogsSortBy {
  name = 'name',
  description = 'description',
  websiteUrl = 'websiteUrl',
  createdAt = 'createdAt',
  isMembership = 'isMembership',
}

export class CreateBlogInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(15)
  declare name: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(500)
  declare description: string;

  @Trim()
  @IsUrl()
  declare websiteUrl: string;
}

export class UpdateBlogInputDto extends CreateBlogInputDto {}

export class GetBlogsQueryParams extends BasicPagingParams {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  searchNameTerm?: string;

  @IsOptional()
  @IsEnum(BlogsSortBy)
  sortBy: BlogsSortBy = BlogsSortBy.createdAt;
}

export type GetBlogsRepoQueryParams = {
  searchNameTerm?: string;
  pagingParams: PagingParamsType;
};

export type CreateBlogParams = {
  name: string;
  description: string;
  websiteUrl: string;
};

export type UpdateBlogParams = CreateBlogParams & {
  id: string;
};

export type CreateBlogRepoParams = CreateBlogParams & {
  createdAt: string;
  isMembership: boolean;
};

export type UpdateBlogRepoParams = UpdateBlogParams;

// mongoose only
export type BlogDbType = WithId<{
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}>;
