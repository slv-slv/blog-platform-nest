import { IsEnum, IsString, IsUrl, MaxLength } from 'class-validator';
import { WithId } from 'mongodb';
import { BasicPagingParams } from '../../../common/types/paging-params.types.js';

export type BlogType = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type BlogDbType = WithId<{
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}>;

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
  @MaxLength(15)
  name: string;

  @MaxLength(500)
  description: string;

  @IsUrl()
  websiteUrl: string;
}

export class UpdateBlogInputDto extends CreateBlogInputDto {}

export class GetBlogsQueryParams extends BasicPagingParams {
  @IsString()
  searchNameTerm: string | null = null;

  @IsEnum(BlogsSortBy)
  sortBy: BlogsSortBy;
}
