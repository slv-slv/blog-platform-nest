import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { WithId } from 'mongodb';
import { Trim } from '../../common/decorators/trim.js';
import { BasicPagingParams } from '../../common/types/paging-params.types.js';

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
  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(15)
  name: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @Trim()
  @IsUrl()
  websiteUrl: string;
}

export class UpdateBlogInputDto extends CreateBlogInputDto {}

export class GetBlogsQueryParams extends BasicPagingParams {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  searchNameTerm: string | null = null;

  @IsOptional()
  @IsEnum(BlogsSortBy)
  sortBy: BlogsSortBy = BlogsSortBy.createdAt;
}
